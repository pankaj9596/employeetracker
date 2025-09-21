const cds = require("@sap/cds");

const {
  calculateDaysDifference,
  formatDate,
  formatTime,
} = require("./utils/external");

module.exports = (srv) => {
  let { Employees, PunchingDetails, LeaveRequests, LeaveBalances } =
    srv.entities;

  srv.before("CREATE", Employees, async (req) => {
    try {
      let { EMAIL } = req.data;
      req.data.LAUNCHPAD_USER = EMAIL;
    } catch (error) {
      console.log(error);
    }
  });

  srv.after("CREATE", Employees, async (data, req) => {
    const empId = data.EMP_ID;
    let db = await cds.connect.to("db");
    let oLeaveBalances = {
      EMP_ID: empId,
      TOTAL_LEAVE_COUNT: 21,
      AVAILABLE_LEAVE_COUNT: 21,
    };
    await db.run(INSERT.into(LeaveBalances, oLeaveBalances));
  });

  srv.before("CREATE", LeaveRequests, async (req) => {
    let db = await cds.connect.to("db");
    let tx = db.tx();
    try {
      let { LEAVE_REQUEST_ID, EMP_ID, FROM_DATE, TO_DATE } = req.data;
      let aLeaveBalance = await db.run(
        SELECT.from(LeaveBalances).where({ EMP_ID: EMP_ID })
      );
      let totalDaysOfLeave =
        (await calculateDaysDifference(FROM_DATE, TO_DATE)) + 1;
      req.data.STATUS = "Pending";
      await tx.update(LeaveRequests, LEAVE_REQUEST_ID).with(req.data);
      await tx.commit();
      if (aLeaveBalance[0].AVAILABLE_LEAVE_COUNT < totalDaysOfLeave) {
        const message = `Insufficient leave. Employee Id ${EMP_ID} you have ${aLeaveBalance[0].AVAILABLE_LEAVE_COUNT} leave, requested ${totalDaysOfLeave}.`;
        return req.error(400, message);
      }
    } catch (error) {
      await tx.rollback(error);
    }
  });

  srv.on("Punch", async (req) => {
    let db = await cds.connect.to("db");
    let tx = db.tx();
    try {
      let oResponse = {};
      let { Action, EmpId } = req.data;
      const UTCDate = new Date(Date.now());
      const ISTDate = new Date(
        UTCDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const punchDate = formatDate(ISTDate); // "18-09-2025"
      let aEmployee = await tx.run(
        SELECT.from(PunchingDetails).where({
          EMP_ID: EmpId,
          PUNCH_DATE: punchDate,
        })
      );
      if (Action === "IN") {
        const punchInTime = formatTime(ISTDate);
        if (aEmployee.length > 0) {
          return req.error(
            400,
            `Employee Id ${EmpId} you are already punched in`
          );
        }
        let oPunchInObj = {
          EMP_ID: EmpId,
          PUNCH_DATE: punchDate,
          PUNCH_IN: punchInTime,
          PUNCH_OUT: "",
        };

        await INSERT.into(PunchingDetails, oPunchInObj);
        oResponse = {
          status: 200,
          sResponsMsg: `Good morning, Employee Id ${EmpId} you have successfully punched in, have a great day.`,
        };
      } else {
        const UTCDate = new Date(Date.now());
        const ISTDate = UTCDate.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        });
        const punchDate = formatDate(ISTDate);
        const punchOutTime = formatTime(ISTDate);
        const aPunchOutData = await SELECT.from(PunchingDetails).where({
          EMP_ID: EmpId,
          PUNCH_DATE: punchDate,
        });
        if (aPunchOutData.length === 0) {
          return req.error(
            400,
            `Employee Id ${EmpId} you haven't punched in yet.`
          );
        }
        const oPunchOutObj = aPunchOutData[0];
        oPunchOutObj.PUNCH_OUT = punchOutTime;
        await tx.update(PunchingDetails).set(oPunchOutObj).where({
          EMP_ID: oPunchOutObj.EMP_CODE_EMP_ID,
          PUNCH_DATE: oPunchOutObj.PUNCH_DATE,
        });
        oResponse = {
          status: 200,
          sResponsMsg: `Employeed Id ${EmpId} you've successfully punched out, good bye.`,
        };
        await tx.commit();
      }
      let { res } = req.http;
      res.send(oResponse);
    } catch (error) {
      await tx.rollback(error);
    }
  });



  srv.on("ApproveLeave", async (req) => {
    let db = await cds.connect.to("db");
    let tx = db.tx();
    try {
      let { LeaveType, EmpId, LeaveRequestId } = req.data;
      var aRequestedLeave = await SELECT.from(LeaveRequests, (leave) => {
        leave.TYPE,
          leave.FROM_DATE,
          leave.TO_DATE,
          leave.STATUS,
          leave.PRIORITY,
          leave.REASON,
          leave.EMP_ID,
          leave.LEAVE_REQUEST_ID;
      }).where({
        LEAVE_REQUEST_ID: LeaveRequestId,
        TYPE: LeaveType,
        EMP_ID: EmpId,
      });
      let aLeaveBalance = await SELECT.from(LeaveBalances).where({
        EMP_ID: EmpId,
      });
      let totalDaysOfLeave =
        (await calculateDaysDifference(
          aRequestedLeave[0].FROM_DATE,
          aRequestedLeave[0].TO_DATE
        )) + 1;

      if (aLeaveBalance[0].AVAILABLE_LEAVE_COUNT < totalDaysOfLeave) {
        return req.error(
          400,
          `Insufficient leave balance, you have total ${aLeaveBalance[0].AVAILABLE_LEAVE_COUNT} leave`
        );
      }
      aLeaveBalance[0].AVAILABLE_LEAVE_COUNT -= totalDaysOfLeave;
      const updatedStatus = await tx
        .update(LeaveBalances, aLeaveBalance[0].LEAVE_BALANCE_ID)
        .with(aLeaveBalance[0]);
      if (updatedStatus === 1) {
        aRequestedLeave[0].STATUS = "Approved";
        await tx.update(LeaveRequests, LeaveRequestId).with(aRequestedLeave[0]);
      }
      await tx.commit();
      var oResponse = {
        status: 200,
        message: `Employee Id ${EmpId} your leave approved successfully`,
      };
      let { res } = req.http;
      res.send(oResponse);
    } catch (error) {
      await tx.rollback(error);
    }
  });

  srv.on("RejectLeave", async (req) => {
    let db = await cds.connect.to("db");
    let tx = db.tx();
    try {
      let { LeaveType, EmpId, LeaveRequestId } = req.data;
      const aRequestedLeave = await SELECT.from(LeaveRequests).where({
        LEAVE_REQUEST_ID: LeaveRequestId,
        TYPE: LeaveType,
        EMP_ID: EmpId,
      });
      aRequestedLeave[0].STATUS = "Rejected";
      await await tx
        .update(LeaveRequests, LeaveRequestId)
        .with(aRequestedLeave[0]);
      await tx.commit();
      var oResponse = {
        status: 200,
        message: `Sorry, Employee Id ${EmpId} your leave rejected`,
      };
      let { res } = req.http;
      res.send(oResponse);
    } catch (error) {}
  });


  srv.on("GetLoggedInUser", async (req) => {
    let db = await cds.connect.to("db");
    let { Email } = req.data;
    const oUser = await db.run(
      SELECT.one
        .from(Employees)
        .columns("EMP_ID", "FIRST_NAME", "LAST_NAME", "DESIGNATION")
        .where({ LAUNCHPAD_USER: Email })
    );
    return oUser || {};
  });
};
