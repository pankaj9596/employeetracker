namespace zemployeetraceker.db.schema;

entity EMPLOYEE {
    key EMP_ID            : UUID      @title: 'Employee Id';
        FIRST_NAME        : String    @title: 'First Name';
        LAST_NAME         : String    @title: 'Last Name';
        GENDER            : String    @title: 'Gender';
        EMAIL             : String    @title: 'Email';
        LAUNCHPAD_USER    : String    @title: 'Launchpad User';
        EXPERIENCE        : Integer   @title: 'Experience';
        DESIGNATION       : String    @title: 'Designation';
        MODULE            : String    @title: 'Module';
        MODULE_TYPE       : String    @title: 'Module Type';
        PHONE_NO          : Integer64 @title: 'Phone No';
        ItsLeaveRequest   : Association to many LEAVE_REQUEST
                                on ItsLeaveRequest.EMP_ID = $self.EMP_ID;
        ItsLeaveBalance   : Association to one LEAVE_BALANCE
                                on ItsLeaveBalance.EMP_ID = $self.EMP_ID;
        ItsPunchingDetail : Association to many PUNCHING_DETAILS
                                on ItsPunchingDetail.EMP_ID = $self.EMP_ID;
};

entity LEAVE_BALANCE {
    key LEAVE_BALANCE_ID      : UUID;
        EMP_ID                : UUID;
        TOTAL_LEAVE_COUNT     : Integer;
        AVAILABLE_LEAVE_COUNT : Integer;
        ItsEmployee           : Association to one EMPLOYEE
                                    on ItsEmployee.EMP_ID = $self.EMP_ID;
};

entity PUNCHING_DETAILS {
    key PUNCH_ID    : UUID;
        EMP_ID      : UUID;
        PUNCH_DATE  : String;
        PUNCH_IN    : String;
        PUNCH_OUT   : String;
        ItsEmployee : Association to one EMPLOYEE
                          on ItsEmployee.EMP_ID = $self.EMP_ID;
}

entity LEAVE_REQUEST {
    key LEAVE_REQUEST_ID : UUID   @title: 'Leave Request Id';
        EMP_ID           : UUID;
        FROM_DATE        : String @title: 'From Date';
        TO_DATE          : String @title: 'To Date';
        TYPE             : String @title: 'Type';
        PRIORITY         : String @title: 'Priority';
        STATUS           : String @title: 'Status';
        REASON           : String @title: 'Reason';
        ItsEmployee      : Association to one EMPLOYEE
                               on ItsEmployee.EMP_ID = $self.EMP_ID;
}
