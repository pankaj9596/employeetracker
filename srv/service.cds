namespace zemployeetraceker.srv.service;

using {zemployeetraceker.db.schema as db} from '../db/schema';


service TIME_TRACKER_SRV @(path: '/odata') {

    entity Employees       as projection on db.EMPLOYEE;

    entity LeaveBalances   as projection on db.LEAVE_BALANCE;

    @readonly: true
    entity PunchingDetails as
        projection on db.PUNCHING_DETAILS {
            *,
            case
                when cast ( PUNCH_IN as Time) > '10:10:00'
                     then 'Late'
                else 'On Time'
            end as ARRIVAL_STATUS : String,
            case
                when cast ( PUNCH_IN as Time) > '10:10:00'
                     then 1
                else 3
            end as CRITICALITY    : Integer
        }

    entity LeaveRequests   as projection on db.LEAVE_REQUEST;

    @cds.redirection.target
    entity PunchUser       as projection on db.PUNCHING_DETAILS;


    @open
    type object {};

    function GetLoggedInUser(Email: String)                                         returns object;
    action   Punch(Action: String, EmpId: String)                                   returns object;
    action   ApproveLeave(LeaveRequestId: String, LeaveType: String, EmpId: String) returns object;
    action   RejectLeave(LeaveRequestId: String, LeaveType: String, EmpId: String)  returns object;
}
