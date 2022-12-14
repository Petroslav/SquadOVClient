// Affiliation
const COMBATLOG_OBJECT_AFFILIATION_MINE         = 0x00000001;
const COMBATLOG_OBJECT_AFFILIATION_PARTY        = 0x00000002;
const COMBATLOG_OBJECT_AFFILIATION_RAID         = 0x00000004;
const COMBATLOG_OBJECT_AFFILIATION_OUTSIDER     = 0x00000008;
const COMBATLOG_OBJECT_AFFILIATION_MASK         = 0x0000000F;
// Reaction
const COMBATLOG_OBJECT_REACTION_FRIENDLY        = 0x00000010;
const COMBATLOG_OBJECT_REACTION_NEUTRAL         = 0x00000020;
const COMBATLOG_OBJECT_REACTION_HOSTILE         = 0x00000040;
const COMBATLOG_OBJECT_REACTION_MASK            = 0x000000F0;
// Ownership
const COMBATLOG_OBJECT_CONTROL_PLAYER           = 0x00000100;
const COMBATLOG_OBJECT_CONTROL_NPC              = 0x00000200;
const COMBATLOG_OBJECT_CONTROL_MASK             = 0x00000300;
// Unit type
const COMBATLOG_OBJECT_TYPE_PLAYER              = 0x00000400;
const COMBATLOG_OBJECT_TYPE_NPC                 = 0x00000800;
const COMBATLOG_OBJECT_TYPE_PET                 = 0x00001000;
const COMBATLOG_OBJECT_TYPE_GUARDIAN            = 0x00002000;
const COMBATLOG_OBJECT_TYPE_OBJECT              = 0x00004000;
const COMBATLOG_OBJECT_TYPE_MASK                = 0x0000FC00;
// Special cases (non-exclusive)
const COMBATLOG_OBJECT_TARGET                   = 0x00010000;
const COMBATLOG_OBJECT_FOCUS                    = 0x00020000;
const COMBATLOG_OBJECT_MAINTANK                 = 0x00040000;
const COMBATLOG_OBJECT_MAINASSIST               = 0x00080000;
const COMBATLOG_OBJECT_NONE                     = 0x80000000;
const COMBATLOG_OBJECT_SPECIAL_MASK             = 0xFFFF0000;

export function objectHasType(flags: number): boolean {
    return ((flags & COMBATLOG_OBJECT_TYPE_MASK) > 0)
}

export function isObjectFriendly(flags: number): boolean {
    return ((flags & COMBATLOG_OBJECT_REACTION_FRIENDLY) > 0)
}

export function isObjectHostile(flags: number): boolean {
    return ((flags & COMBATLOG_OBJECT_REACTION_HOSTILE) > 0)
}

export function isObjectNeutral(flags: number): boolean {
    return ((flags & COMBATLOG_OBJECT_REACTION_NEUTRAL) > 0)
}

export function isObjectPlayer(flags: number): boolean {
    return ((flags & COMBATLOG_OBJECT_TYPE_PLAYER) > 0)
        && ((flags & COMBATLOG_OBJECT_CONTROL_PLAYER) > 0)
}

export function isObjectNpc(flags: number): boolean {
    return ((flags & COMBATLOG_OBJECT_CONTROL_NPC) > 0)
}

export function isObjectPet(flags: number): boolean {
    return ((flags & COMBATLOG_OBJECT_TYPE_PET) > 0)
        || ((flags & COMBATLOG_OBJECT_TYPE_GUARDIAN) > 0)
}

export const WOW_OVERRIDE_BOSS_NAMES: string[] = [
    "Margrave Stradama"   
]

export const BLOODLUST_SPELL_IDS = new Set([
    2825,
    71975,
    80353,
    146555,
    147118,
    178207,
    230935,
    256740,
    267572,
    267575,
    287925,
    290583,
    292686,
    309658
])

export const WOW_IMPORTANT_SPELL_IDS = new Set([
    48792,
    55233,
    51271,
    48707,
    152279,
    219809,
    194679,
    194844,
    206977,
    207256,
    207319,
    207171,
    212332,
    212337,
    91800,
    91797,
    116888,
    49039,
    288977,
    315443,
    311648,
    198589,
    212800,
    162264,
    187827,
    188501,
    196555,
    207810,
    102560,
    102543,
    102558,
    33891,
    61336,
    22812,
    1850,
    252216,
    106951,
    69369,
    112071,
    194223,
    102342,
    102351,
    155835,
    29166,
    200851,
    203727,
    236696,
    305497,
    163505,
    323557,
    108291,
    108292,
    108293,
    108294,
    323546,
    19263,
    186265,
    53271,
    53480,
    186257,
    212640,
    193526,
    193530,
    266779,
    186289,
    3355,
    202748,
    212704,
    45438,
    12042,
    12472,
    198111,
    198144,
    86949,
    87024,
    190319,
    110909,
    342246,
    324220,
    122278,
    122783,
    115203,
    201318,
    243435,
    115176,
    201325,
    116849,
    122470,
    125174,
    152173,
    216113,
    197908,
    209584,
    202335,
    310454,
    1022,
    1044,
    642,
    31884,
    31842,
    231895,
    224668,
    105809,
    31850,
    205191,
    184662,
    86659,
    212641,
    228049,
    216331,
    210294,
    498,
    204018,
    215652,
    33206,
    47585,
    47788,
    10060,
    197862,
    197871,
    200183,
    213610,
    197268,
    193223,
    319952,
    47536,
    109964,
    194249,
    218413,
    15286,
    213602,
    185313,
    185422,
    2983,
    31224,
    5277,
    51690,
    121471,
    199754,
    31230,
    45182,
    343142,
    1833,
    1330,
    6770,
    207736,
    1966,
    204288,
    79206,
    16166,
    114050,
    114051,
    114052,
    210918,
    108271,
    204293,
    108416,
    104773,
    196098,
    113860,
    113858,
    212295,
    184364,
    871,
    18499,
    46924,
    227847,
    118038,
    107574,
    198817,
    197690,
    23920,
    216890,
    236273,
    260708,
    202147,
    12975,
    223658,
    199086,
    206891,
    642,
    47585,
    1022,
    31224,
    871,
    33206,
    5277,
    45438,
    48792,
    19263,
    186265,
    48707,
    51690,
    118038,
    108271,
    201318,
    115203,
    243435,
    115176,
    122470,
    125174,
    219809,
    206977,
    207319,
    198589,
    212800,
    162264,
    187827,
    188501,
    196555,
    207810,
    198111,
    198144,
    31850,
    205191,
    184662,
    213610,
    197268,
    193223,
    319952,
    210918,
    212295,
    86659,
    228049,
    116849,
    102560,
    102543,
    102558,
    33891,
    197690,
    193530,
    266779,
    199754,
    204293,
    343142,
    194249,
    218413,
    15286,
    203727,
    236696,
    305497,
    209584,
    216890,
    23920,
    152279,
    34709,
    25771,
    216331,
    215769,
    236273,
    213602,
    196762,
    260708,
    223658,
    204018,
    212704,
    1966,
    210294,
    104773,
    190319,
    12042,
    12472,
    29166,
    6940,
    199448,
    199452,
    196098,
    113860,
    113858,
    49039,
    288977,
    315443,
    323557,
    108291,
    108292,
    108293,
    108294,
    110909,
    342246,
    310143,
    324867,
    300728,
    33786,
    209753,
    339,
    235963,
    202767,
    202768,
    202771,
    274281,
    274282,
    274283,
    2637,
    982,
    19434,
    19386,
    1513,
    118,
    28271,
    28272,
    61305,
    61721,
    61025,
    61780,
    161372,
    161355,
    161353,
    161354,
    126819,
    277787,
    277792,
    31687,
    203286,
    199786,
    113724,
    224968,
    257537,
    314793,
    307443,
    314791,
    205406,
    198898,
    20066,
    10326,
    9484,
    605,
    32375,
    265202,
    289666,
    325013,
    323673,
    51514,
    210873,
    211004,
    211015,
    211010,
    269352,
    277778,
    277784,
    309328,
    207778,
    191634,
    320137,
    210714,
    320674,
    328923,
    710,
    5782,
    691,
    712,
    697,
    688,
    30146,
    157757,
    157898,
    112866,
    112867,
    112870,
    112868,
    112869,
    152108,
    30283,
    30108,
    116858,
    6358,
    115268,
    265187,
    29893,
    183601,
    6201,
    325289,
    321792,
    325640,
    64382,
    213644,
    236186,
    51886,
    2782,
    213634,
    218164,
    475,
    4987,
    77130,
    88423,
    527,
    115450,
    89808,
    137178,
    119905,
    212623,
    212620,
    528,
    370,
    19505,
    278326,
    19801,
    2825,
    32182,
    80353,
    90355,
    160452,
    178207,
    204361,
    272678,
    204362,
    107079,
    20549,
    28730,
    25046,
    50613,
    69179,
    155145,
    129597,
    202719,
    80483,
    232633,
    58984,
    20594,
    7744,
    59752,
    287712,
    295707,
    208683,
    195710,
    336126,
    42292,
    23035,
    23034,
    213664,
    6262,
    265221,
    256948,
    257040,
    255654,
    302144,
    305252,
    324631,
    323436,
    47528,
    47476,
    47568,
    207127,
    207289,
    49206,
    207349,
    77606,
    51052,
    108194,
    108199,
    196770,
    152280,
    207167,
    204160,
    305392,
    279302,
    343294,
    275699,
    212468,
    49576,
    212552,
    49028,
    48265,
    203173,
    48743,
    46584,
    46585,
    327574,
    288853,
    324128,
    312202,
    183752,
    179057,
    206649,
    205604,
    205629,
    205630,
    202138,
    207684,
    202140,
    202137,
    207682,
    211881,
    203704,
    217832,
    221527,
    196718,
    198013,
    235903,
    317009,
    306830,
    323639,
    329554,
    740,
    78675,
    102280,
    108238,
    102359,
    99,
    5211,
    102417,
    102383,
    49376,
    16979,
    102416,
    102401,
    106839,
    203651,
    201664,
    61391,
    132469,
    5215,
    22570,
    236026,
    209749,
    2908,
    202246,
    102793,
    197721,
    325727,
    323764,
    327071,
    327022,
    327037,
    147362,
    109248,
    109304,
    131894,
    121818,
    201430,
    202914,
    208652,
    205691,
    187707,
    187650,
    191241,
    213691,
    201078,
    186387,
    120360,
    203415,
    1543,
    199483,
    236776,
    248518,
    325028,
    308491,
    257284,
    19577,
    324149,
    328231,
    2139,
    66,
    12051,
    110959,
    153595,
    153561,
    198158,
    30449,
    205021,
    235219,
    235450,
    235313,
    11426,
    205025,
    108839,
    31661,
    55342,
    122,
    116841,
    119381,
    123904,
    115078,
    116705,
    119996,
    137639,
    115310,
    132578,
    198664,
    325197,
    322118,
    214326,
    115080,
    322109,
    233759,
    122470,
    209525,
    205320,
    116844,
    202370,
    325216,
    327104,
    326860,
    96231,
    853,
    31821,
    190784,
    115750,
    210220,
    210256,
    633,
    6940,
    199448,
    199452,
    267798,
    343527,
    152262,
    343721,
    316958,
    328282,
    328620,
    328622,
    328281,
    304971,
    328204,
    8122,
    34433,
    64044,
    15487,
    64843,
    19236,
    123040,
    204263,
    2050,
    88625,
    205369,
    211522,
    108968,
    208065,
    62618,
    271466,
    263165,
    73325,
    215769,
    305498,
    32379,
    289657,
    316262,
    327661,
    325013,
    324724,
    2094,
    1766,
    1856,
    76577,
    212182,
    79140,
    207777,
    200806,
    198529,
    408,
    199804,
    185767,
    193316,
    192759,
    1776,
    13750,
    1784,
    206328,
    328305,
    185311,
    323547,
    323654,
    328547,
    108281,
    118345,
    57994,
    198067,
    198103,
    192249,
    204437,
    305483,
    51490,
    320125,
    326059,
    98008,
    51485,
    108280,
    108269,
    152255,
    192058,
    192077,
    196932,
    192222,
    204330,
    204331,
    204332,
    207399,
    198838,
    204336,
    8143,
    16191,
    324386,
    6789,
    5484,
    19647,
    119910,
    171140,
    171138,
    212619,
    115781,
    132409,
    119910,
    251523,
    251922,
    288047,
    119898,
    48020,
    111859,
    111895,
    111896,
    111897,
    111898,
    196277,
    115770,
    6360,
    1122,
    201996,
    205180,
    199954,
    199892,
    199890,
    80240,
    312321,
    205179,
    97462,
    5246,
    6552,
    107566,
    46968,
    118000,
    107570,
    152277,
    228920,
    1160,
    213915,
    236077,
    236236,
    236320,
    6544,
    206572,
    325886,
    324143,
    307865,
    64382,
    19647,
    119910,
    171140,
    171138,
    212619,
    115781,
    132409,
    119910,
    251523,
    251922,
    288047,
    119898,
    2139,
    1766,
    6552,
    47528,
    96231,
    93985,
    97547,
    57994,
    116705,
    147362,
    183752,
    187707,
    19647,
    171140,
    171138,
    212619,
    119910,
    115781,
    119898,
    2139,
    1766,
    6552,
    47528,
    96231,
    93985,
    97547,
    57994,
    116705,
    147362,
    183752,
    187707
])

export function doesWowPatchSupportArmory(p: string): boolean {
    let major = parseInt(p.split('.')[0])
    if (major >= 9) {
        return true
    } else {
        return false
    }
}