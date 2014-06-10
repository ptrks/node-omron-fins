
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
    DNA : 0x01,
    DA1 : 0x36,
    DA2 : 0x00,
    SNA : 0x01,
    SA1 : 0x00,
    SA2 : 0x00,
    SID : 0x00
};

module.exports.Commands = {
    MEMORY_AREA_READ  : [0x01,0x01],
    MEMORY_AREA_WRITE : [0x01,0x02],
    MEMORY_AREA_FILL  : [0x01,0x03],
    RUN               : [0x04,0x01],
    STOP              : [0x04,0x02]
};

module.exports.MemoryAreas = {
    'D' : 0x82
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

