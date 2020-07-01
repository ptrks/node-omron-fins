
module.exports.DefaultHostValues = {
    host : '127.0.0.1',
    port : 9600
};



module.exports.DefaultOptions = {
   timeout: 2000
};


module.exports.DefaultFinsHeader = {
    ICF : 0x80,
    RSV : 0x00,
    GCT : 0x02,
    DNA : 0x00,
    DA1 : 0x00,
    DA2 : 0x00,
    SNA : 0x00,
    SA1 : 0x22,
    SA2 : 0x00,
    SID : 0x00
};

module.exports.Commands = {
    CONTROLLER_STATUS_READ : [0x06,0x01],
    MEMORY_AREA_READ       : [0x01,0x01],
    MEMORY_AREA_WRITE      : [0x01,0x02],
    MEMORY_AREA_FILL       : [0x01,0x03],
    MEMORY_AREA_READ_MULTI : [0x01,0x04],
    MEMORY_AREA_TRANSFER   : [0x01,0x05],
    RUN                    : [0x04,0x01],
    STOP                   : [0x04,0x02]
};

module.exports.FatalErrorData = {
    SYSTEM_ERROR      : 1 << 6,
    IO_SETTING_ERROR  : 1 << 10,
    IO_POINT_OVERFLOW : 1 << 11,
    CPU_BUS_ERROR     : 1 << 14,
    MEMORY_ERROR      : 1 << 15
};

module.exports.NonFatalErrorData = {
    PC_LINK_ERROR         : 1 << 0 ,
    HOST_LINK_ERROR       : 1 << 1,
    BATTERY_ERROR         : 1 << 4,
    REMOTE_IO_ERROR       : 1 << 5,
    SPECIAL_IO_UNIT_ERROR : 1 << 8,
    IO_COLLATE_ERROR      : 1 << 9,
    SYSTEM_ERROR          : 1 << 15
};

module.exports.Status = {
    CPU_STANDBY : 0x80,
    STOP        : 0x00,
    RUN         : 0x01
};

module.exports.Modes = {
    MONITOR : 0x02,
    DEBUG   : 0x01,
    RUN     : 0x04
};


module.exports.MemoryAreas = {
    'E'  : 0xA0,//Extended Memories
    'C'  : 0xB0,//CIO
    'CB' : 0x30,//CIO reading in bit
    'W'  : 0xB1,//Work Area
    'WB' : 0x31,//Work Area reading in bit
    'H'  : 0xB2,//Holding Bit
    'HB' : 0x32,//Holding Bit reading in bit
    'A'  : 0xB3,//Auxiliary Bit
    'AB' : 0x33,//Auxiliary Bit reading in bit
    'D'  : 0x82,//Data Memories
    'DM' : 0x02//Data Memories reading in bit
};

module.exports.Errors = {
    '0000': 'Completed normally',
    '0001': 'Service was interrupted',
    '0101': 'Local node not part of Network',
    '0102': 'Token time-out, node number too large',
    '0103': 'Number of transmit retries exceeded',
    '0104': 'Maximum number of frames exceeded',
    '0105': 'Node number setting error (range)',
    '0106': 'Node number duplication error'
};

