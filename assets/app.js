/**
 * Seedance — FULL app.js (Tap Hint UI + Auto-Next + Analytics + Fingerprint light)
 * ✅ GUARANTEE FP:
 * - Có stableStringify() встро sẵn (không phụ thuộc lib)
 * - Sau khi user consent (Like), buildFingerprintLight() và:
 *    (1) gửi ngay event "consent_ok" kèm fp_light + fp_light_hash
 *    (2) lưu fp_light_hash vào localStorage để dùng lại cho các quick events / session summary
 *    (3) (tuỳ chọn) cố gắng build lại fp_light nền sau consent đã có, nhưng không block UI
 *
 * Lưu ý:
 * - "FP light" KHÔNG bao gồm canvas/webgl/audio/fonts. Chỉ UA/UA-CH + screen/viewport + prefs + net + deviceMemory/cores.
 * - Nếu browser không hỗ trợ UA-CH high entropy hoặc Network Info => tự null (không lỗi).
 *
 * CORS note:
 * - summary sendBeacon dùng text/plain để hạn chế preflight
 */

const WORKER_BASE = "https://seedance.testmail12071997.workers.dev";
const SESSION_ENDPOINT = `${WORKER_BASE}/api/session`;

/* KEEP YOUR VIDEO URLS */
const RAW_LIST = [
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/1_719651997804681-1774161702959.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/2_1649389146009528-1774161728298.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/3_971013752116401-1774161745509.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/4_1227412262793849-1774161760097.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/5_1405728304201720-1774161774252.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/6_1248470780757958-1774161780596.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/7_2415075162270793-1774161787875.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/8_1508591661272033-1774161794070.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/9_958614273772318-1774161804343.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/10_926443399773267-1774161815872.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/11_912917948295385-1774161827955.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/12_1447292346902029-1774161840255.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/13_5060812651083273-1774161858371.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/14_1290977449541131-1774161897824.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/15_1456870935953155-1774161908472.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/16_738648675848561-1774161928964.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/17_2752497081755920-1774161941528.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/18_26527792670139827-1774161998795.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/19_1614116116378933-1774162476021.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/20_2045665222676302-1774162479468.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/21_858054093947888-1774162482474.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/22_2460411754740042-1774162485985.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/23_1479247157104143-1774162489365.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/24_892722090277792-1774162492351.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/25_1856703004989647-1774162495870.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/26_1427120688885210-1774162499284.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/27_1324466232775091-1774162503104.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/28_1476055587224171-1774162506075.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/29_1171251675081021-1774162508725.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/30_1374309291377843-1774162511232.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/31_1260512612658507-1774162515430.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/32_1460293532326839-1774162518463.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/33_1993348417889999-1774162520994.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/34_1554269938987024-1774162524178.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/35_3998299150475854-1774162527333.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/36_901258162519274-1774162529989.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/37_902852309262815-1774162533468.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/38_1410005277244285-1774162537249.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/39_1574516940323207-1774162540241.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/40_1634215824261769-1774162543310.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/41_1583848016001989-1774162547243.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/42_909217121489179-1774162550081.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/43_970333585425564-1774162552968.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/44_1602402677427809-1774162555978.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/45_1471158981403842-1774162558544.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/46_1672617424147675-1774162561614.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/47_1576349500313368-1774162565445.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/48_1970611210534360-1774162568468.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/49_1662250201855803-1774162571839.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/50_1446590166859002-1774162575749.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/51_1140818901363030-1774162578885.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/52_963050986047153-1774162583190.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/53_2008145533065681-1774162586824.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/54_2274290269725153-1774162589315.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/55_1598970744559793-1774162592737.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/56_1435307924888528-1774162596327.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/57_1618931105905486-1774162599588.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/58_1867211733982942-1774162603716.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/59_1564142114844378-1774162608084.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/60_2822326834770610-1774162611255.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/61_1683757016117560-1774162613359.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/62_1607410023616324-1774162614990.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/63_1280421343962039-1774162616440.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/64_778245902019747-1774162618752.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/65_1961011431179035-1774162621814.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/66_914579214319622-1774162624311.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/67_1246547447571329-1774162626972.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/68_1466321385096529-1774162630345.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/69_1284730906803804-1774162633533.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/70_791834686678712-1774162637396.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/71_921166487506230-1774162639785.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/72_2137573923725314-1774162642336.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/73_784141818068715-1774162645000.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/74_3809842985977929-1774162647917.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/75_1833994703973733-1774162651016.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/76_927435483183759-1774162653923.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/77_757117183688702-1774162657018.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/78_1287552036520734-1774162660446.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/79_1286512079991485-1774162663392.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/80_2026968704902332-1774162667114.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/81_2285344055289428-1774162670577.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/82_909093834848060-1774162674162.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/83_33590842947225792-1774162678489.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/84_1013073474597099-1774162682050.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/85_1554374189173439-1774162684901.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/86_1564848334732724-1774162687766.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/87_1243657694526284-1774162691922.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/88_1384515440088007-1774162695378.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/89_1469143754782658-1774162698562.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/90_1823441731691363-1774162701724.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/91_1864706424411264-1774162705031.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/92_1677642126553439-1774162707742.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/93_1612954796545415-1774162710442.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/94_1610276563440487-1774162713526.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/95_1949692025643943-1774162717087.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/96_1162963082248093-1774162720272.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/97_1668949344085933-1774162722913.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/98_1824795224841991-1774162726364.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/99_870253319322150-1774162729314.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/100_2261805630979481-1774162731403.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/101_1638158877149218-1774162734195.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/102_1737658704286091-1774162736661.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/103_731980312837582-1774162739683.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/104_713075278211526-1774162742245.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/105_1172081681803627-1774162745057.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/106_32920696020879367-1774162747853.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/107_736144549042697-1774162749755.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/108_1960430151485525-1774162752419.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/109_1395383108888641-1774162755596.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/110_1236343745078384-1774162758691.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/111_2994029484319109-1774162761840.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/112_1782057039124771-1774162765490.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/113_1595243641468987-1774162768787.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/114_1361895885686495-1774162772847.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/115_25281334204849044-1774162775837.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/116_1360191852495849-1774162778818.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/117_1620793182616527-1774162783324.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/118_1927349344485352-1774162787440.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/119_33211749261773718-1774162791750.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/120_4338276193108985-1774162793749.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/121_25467604929499919-1774162795896.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/122_869946955989522-1774162798326.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/123_811555278517441-1774162800987.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/124_4714583095435832-1774162803855.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/125_2352643915249611-1774162806179.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/126_2232332597597056-1774162808501.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/127_1987603035428429-1774162810855.mp4",
  "https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/uploads/128_1969941767063118-1774162813728.mp4"
];

const TITLE_BANK = [
  "Khoan vuốt… coi cái này thử đi 😳",
  "Ủa sao tự nhiên coi mà cười hoài vậy 😂",
  "Góc này mà không coi là thiếu sót đó nha",
  "Nhìn nhẹ vậy thôi chứ cuốn dữ lắm 😮‍💨",
  "3 giây đầu chưa đủ đâu… coi tiếp đi 😭",
  "Không biết mọi người sao chứ mình dính rồi đó",
  "Cảnh này coi xong là muốn coi lại liền",
  "Ủa alo? Sao clip này coi hoài không chán",
  "Tự nhiên thấy dễ thương ngang 😳",
  "Coi chơi thôi mà ai ngờ coi tới cuối",
  "Vibe này mà coi buổi tối là hết nước chấm",
  "Ủa sao coi mà quên mất thời gian luôn vậy",
  "Đoạn này mà bỏ là tiếc lắm nha",
  "Coi tới cuối mới thấy cái hay của nó 😮‍💨",
  "Nhẹ nhàng vậy mà dính ghê",
  "Ủa sao tự nhiên thấy tim rung rung vậy trời",
  "Coi mà quên luôn mình đang lướt TikTok",
  "Không hiểu sao coi mà thấy chill ghê",
  "Cảnh này bật full màn hình coi mới đã",
  "Ai coi tới đây chắc cũng giống mình thôi 😭",
  "Thoạt nhìn bình thường mà coi kỹ lại cuốn lắm",
  "Coi lần đầu chưa đủ đâu…",
  "Ủa sao coi mà thấy dễ chịu ghê",
  "Góc này mà quay là auto dính",
  "Coi mà tự nhiên muốn lưu lại liền",
  "Không phải khoe chứ clip này coi hơi bị ổn",
  "Coi tới cuối đi rồi quay lại nói chuyện tiếp 😳",
  "Ủa sao coi mà thấy thương ngang vậy trời",
  "Nhìn vậy thôi chứ coi cuốn lắm nha",
  "Ai đang mệt coi cái này thử đi",
  "Cảnh này mà coi ban đêm là hợp vibe lắm",
  "Ủa sao coi mà thấy muốn coi tiếp nữa",
  "Không hiểu sao clip này coi hoài không ngán",
  "Coi tới đoạn sau mới thấy cái hay",
  "Vibe nhẹ nhẹ mà coi đã ghê",
  "Ủa sao coi mà tự nhiên cười vậy nè",
  "Coi mà quên luôn đang định làm gì",
  "Đoạn này mà bỏ là hơi uổng đó",
  "Coi tới cuối thử coi 😳",
  "Không biết sao chứ mình coi lại lần nữa rồi",
  "Cảnh này coi trên màn hình lớn là hết bài",
  "Ủa sao coi mà thấy yên yên vậy trời",
  "Nhìn đơn giản mà coi cuốn ghê",
  "Coi mà tự nhiên thấy dễ chịu ngang",
  "Đoạn sau mới là đoạn hay nè",
  "Coi thử đi rồi hiểu cảm giác này",
  "Ủa sao coi mà thấy thích nhẹ vậy ta",
  "Coi mà quên luôn thời gian trôi",
  "Cảnh này coi lại vẫn thấy ổn",
  "Không biết mọi người sao chứ mình thấy cuốn",
  "Coi mà tự nhiên muốn share cho bạn bè",
  "Góc này mà quay là hợp TikTok lắm",
  "Coi mà thấy vibe dịu ghê",
  "Ủa sao coi mà thấy vui vui vậy",
  "Coi tới cuối đi đừng bỏ giữa chừng",
  "Không hiểu sao coi mà thấy nhẹ lòng",
  "Cảnh này coi hoài vẫn thấy ổn",
  "Coi mà tự nhiên muốn coi thêm nữa",
  "Ủa sao clip này coi mà không tua nổi",
  "Coi mà quên luôn đang lướt mạng",
  "Nhìn vậy thôi chứ coi là dính đó",
  "Coi thử đi biết đâu hợp vibe bạn",
  "Ủa sao coi mà thấy chill dữ vậy",
  "Coi mà tự nhiên thấy dễ thương ghê",
  "Đoạn này coi lại vẫn thấy hay",
  "Coi mà quên luôn mình vô app làm gì",
  "Không biết sao chứ mình thấy clip này ổn",
  "Coi tới cuối thử nha 😳",
  "Cảnh này coi buổi tối là hợp lắm",
  "Coi mà tự nhiên thấy muốn coi thêm",
  "Nhìn đơn giản mà coi là cuốn",
  "Ủa sao coi mà thấy thích ngang vậy",
  "Coi mà quên luôn thời gian",
  "Đoạn này coi lại lần nữa cũng được",
  "Coi thử đi rồi quay lại đây nói chuyện tiếp 😭"
];

/* ===========================
   Helpers
   =========================== */
function normalizeToUrl(item) { return (item || "").toString().trim(); }

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function now() { return Date.now(); }

/** ✅ stableStringify: sort key để hash fingerprint ổn định */
function stableStringify(value) {
  const seen = new WeakSet();

  function stringify(val) {
    if (val === null) return "null";

    const t = typeof val;
    if (t === "number" || t === "boolean" || t === "string") return JSON.stringify(val);

    if (val instanceof Date) return JSON.stringify(val.toISOString());

    if (Array.isArray(val)) {
      // giữ nguyên thứ tự array
      return "[" + val.map(v => {
        const s = stringify(v);
        return s === undefined ? "null" : s;
      }).join(",") + "]";
    }

    if (t === "object") {
      if (seen.has(val)) return '"[Circular]"';
      seen.add(val);

      const keys = Object.keys(val)
        .filter(k => val[k] !== undefined)
        .sort();

      const props = keys.map(k => JSON.stringify(k) + ":" + stringify(val[k]));
      return "{" + props.join(",") + "}";
    }

    // function/symbol/undefined
    return undefined;
  }

  return stringify(value);
}

function muteIcon(muted) {
  return muted
    ? `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 5L6 9H3v6h3l5 4V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M23 9l-6 6M17 9l6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 5L6 9H3v6h3l5 4V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M15 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
}

/* ===========================
   Video ID based on _nc_gid
   =========================== */
function getQueryParam(url, key) {
  try {
    const u = new URL(url);
    return u.searchParams.get(key) || "";
  } catch {
    const m = String(url).match(new RegExp(`[?&]${key}=([^&]+)`));
    return m ? decodeURIComponent(m[1]) : "";
  }
}

function stableVideoIdFromUrl(url) {
  const gid = getQueryParam(url, "_nc_gid");
  if (gid) return `vid_${gid}`;

  const oe = getQueryParam(url, "oe");
  if (oe) return `vid_oe_${oe}`;

  const ohc = getQueryParam(url, "_nc_ohc");
  if (ohc) return `vid_ohc_${ohc}`;

  const s = String(url);
  return `vid_${s.slice(-12).replace(/[^a-zA-Z0-9_]/g, "") || "unknown"}`;
}

/* ===========================
   Fingerprint (LIGHT) — after consent only
   ✅ GUARANTEE: stableStringify đã có, sha256 ok, lưu hash vào localStorage
   =========================== */
async function getUAHighEntropy() {
  try {
    const uaData = navigator.userAgentData;
    if (!uaData || !uaData.getHighEntropyValues) return null;

    const v = await uaData.getHighEntropyValues([
      "platform", "platformVersion", "architecture", "model",
      "bitness", "wow64", "fullVersionList"
    ]);

    return {
      mobile: !!uaData.mobile,
      brands: (uaData.brands || []).slice(0, 5),
      platform: uaData.platform || "",
      high: v || {}
    };
  } catch {
    return null;
  }
}

function getNetworkInfo() {
  try {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return null;
    return {
      effectiveType: c.effectiveType || "",
      downlink: typeof c.downlink === "number" ? c.downlink : null,
      rtt: typeof c.rtt === "number" ? c.rtt : null,
      saveData: !!c.saveData
    };
  } catch {
    return null;
  }
}

function getPrefs() {
  try {
    return {
      colorScheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      contrastMore: matchMedia("(prefers-contrast: more)").matches
    };
  } catch {
    return null;
  }
}

function getViewport() {
  try {
    return {
      inner: `${window.innerWidth}x${window.innerHeight}`,
      outer: `${window.outerWidth}x${window.outerHeight}`,
      dpr: window.devicePixelRatio || 1
    };
  } catch {
    return null;
  }
}

function getOrientation() {
  try {
    const o = screen.orientation;
    return {
      type: o?.type || "",
      angle: typeof o?.angle === "number" ? o.angle : null
    };
  } catch {
    return null;
  }
}

async function sha256Base64Url(input) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return b64;
}

async function buildFingerprintLight() {
  const uaCh = await getUAHighEntropy();

  const fp = {
    ua: (navigator.userAgent || "").slice(0, 220),
    languages: (navigator.languages || [navigator.language || ""]).slice(0, 6),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    tzOffsetMin: new Date().getTimezoneOffset(),

    platform: navigator.platform || "",
    vendor: navigator.vendor || "",

    deviceMemory: navigator.deviceMemory || null,
    hardwareConcurrency: navigator.hardwareConcurrency || null,

    screen: `${screen.width}x${screen.height}`,
    availScreen: `${screen.availWidth}x${screen.availHeight}`,
    colorDepth: screen.colorDepth || null,

    viewport: getViewport(),
    orientation: getOrientation(),
    prefs: getPrefs(),
    net: getNetworkInfo(),

    uaCh // may be null
  };

  const hash = await sha256Base64Url(stableStringify(fp));
  return { fp_light: fp, fp_light_hash: hash };
}

/** Consent + FP cache */
const CONSENT_KEY = "vid_analytics_ok";
const FP_HASH_KEY = "vid_fp_light_hash";
const FP_RAW_KEY  = "vid_fp_light_raw"; // optional cache (string) để debug; có thể xoá nếu không muốn
function hasConsent() { return localStorage.getItem(CONSENT_KEY) === "1"; }
function getFpHashCached() { return localStorage.getItem(FP_HASH_KEY) || ""; }
function setFpCache(fpPack) {
  if (!fpPack || !fpPack.fp_light_hash) return;
  localStorage.setItem(FP_HASH_KEY, fpPack.fp_light_hash);
  // optional: lưu raw để debug (cân nhắc privacy)
  try { localStorage.setItem(FP_RAW_KEY, stableStringify(fpPack.fp_light)); } catch {}
}

/* ===========================
   DOM
   =========================== */
const feedEl = document.getElementById("feed");
const captionEl = document.getElementById("caption");
const toastEl = document.getElementById("toast");
const btnMute = document.getElementById("btnMute");
const btnGift = document.getElementById("btnGift");

if (btnGift) btnGift.addEventListener("click", () => (window.location.href = "https://mxhvn.github.io/vn/donations.html"));

function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 900);
}

/* ===========================
   Session analytics state
   =========================== */
function getUID() {
  const key = "vid_uid";
  let v = localStorage.getItem(key);
  if (!v) {
    v = (crypto?.randomUUID?.() || `u_${Math.random().toString(16).slice(2)}_${Date.now()}`);
    localStorage.setItem(key, v);
  }
  return v;
}
function getOrCreateSessionId() {
  const key = "vid_session_id";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = (crypto?.randomUUID?.() || `s_${Math.random().toString(16).slice(2)}_${Date.now()}`);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

const UID = getUID();
const SESSION_ID = getOrCreateSessionId();

const session = {
  sid: SESSION_ID,
  uid: UID,
  startedAt: now(),
  endedAt: null,
  durationMs: 0,

  videosSeen: 0,
  videoIdsSeen: [],
  activeVideoId: null,
  watchMsByVideo: {},
  lastTickAt: now(),

  muted: true,
  ref: document.referrer || "",
  url: location.href,
  lang: navigator.language || "",
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
  ua: (navigator.userAgent || "").slice(0, 220),

  metaById: {},

  // ✅ fp state
  fp_light_hash: getFpHashCached() || ""
};

function markVideoSeen(feedId) {
  if (!feedId) return;
  if (!session.videoIdsSeen.includes(feedId)) {
    session.videoIdsSeen.push(feedId);
    session.videosSeen = session.videoIdsSeen.length;
  }
}

function tickWatchTime() {
  const t = now();
  const dt = Math.max(0, t - session.lastTickAt);
  session.lastTickAt = t;

  if (document.visibilityState !== "visible") return;
  const vid = session.activeVideoId;
  if (!vid) return;

  session.watchMsByVideo[vid] = (session.watchMsByVideo[vid] || 0) + dt;
}
setInterval(tickWatchTime, 1000);

/* ===========================
   Quick event sender
   ✅ Always attach fp_light_hash if available after consent
   =========================== */
function sendQuickEvent(eventName, extra = null) {
  const payload = {
    sid: SESSION_ID,
    uid: UID,
    event: eventName,
    ts: Date.now(),
    url: location.href,
    ref: document.referrer || "",
    lang: navigator.language || "",
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    ua: (navigator.userAgent || "").slice(0, 220),
    fp_light_hash: session.fp_light_hash || getFpHashCached() || "",
    ...(extra && typeof extra === "object" ? extra : {})
  };

  try {
    fetch(SESSION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch {}
}

/* ===========================
   Consent Like
   ✅ Guarantee: consent_ok luôn kèm FP (nếu build được)
   =========================== */
async function ensureFpAfterConsent() {
  // Chỉ chạy nếu đã consent mà chưa có fp hash cache
  if (!hasConsent()) return null;
  const cached = getFpHashCached();
  if (cached) {
    session.fp_light_hash = cached;
    return { fp_light_hash: cached };
  }

  // Build và cache
  try {
    const fpPack = await buildFingerprintLight();
    setFpCache(fpPack);
    session.fp_light_hash = fpPack.fp_light_hash || "";
    return fpPack;
  } catch {
    return null;
  }
}

function ensureConsent() {
  if (hasConsent()) {
    // ✅ Nếu đã consent từ trước: cố gắng build fp nền (không ảnh hưởng UI)
    ensureFpAfterConsent().catch(() => {});
    return true;
  }

  const bar = document.createElement("div");
  bar.style.cssText = `
    position:fixed;
    left:50%;
    bottom:16px;
    transform:translateX(-50%);
    z-index:9999;
  `;

  bar.innerHTML = `
    <button id="vidOk" style="
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      height:40px;
      padding:0 14px;
      border:2px solid #000;
      border-radius:999px;
      font-weight:900;
      font-size:14px;
      background:#fff;
      color:#000;
      cursor:pointer;
      box-sizing:border-box;
    ">
      <span>Like</span>
      <span style="font-size:16px;line-height:1">👍</span>
    </button>
  `;

  document.body.appendChild(bar);

  bar.querySelector("#vidOk").addEventListener("click", async () => {
    localStorage.setItem(CONSENT_KEY, "1");

    // ✅ Build FP ngay sau click (user gesture), gửi kèm consent_ok
    let fpPack = null;
    try {
      fpPack = await buildFingerprintLight();
      setFpCache(fpPack);
      session.fp_light_hash = fpPack.fp_light_hash || "";
    } catch {
      fpPack = null;
    }

    // Gửi event consent_ok (kèm fp nếu có)
    sendQuickEvent("consent_ok", fpPack || {});

    bar.remove();
  });

  return false;
}
ensureConsent();

/* ===========================
   Build FEED (id = _nc_gid)
   =========================== */
let FEED = [];

function buildFeedFromRawList() {
  const urls = RAW_LIST.map(normalizeToUrl).filter(Boolean);

  const items = urls.map((url) => {
    const id = stableVideoIdFromUrl(url);
    const nc_gid = getQueryParam(url, "_nc_gid");
    return { id, url, title: pickRandom(TITLE_BANK), nc_gid };
  });

  shuffleInPlace(items);
  return items;
}

/* ===========================
   Tap Hint UI (matches app.css)
   =========================== */
let observer = null;
let globalMuted = true;
let lastTapAt = 0;
let hintTimer = null;

function showControls() {
  if (btnMute) btnMute.classList.remove("is-hidden");
  if (btnGift) btnGift.classList.remove("is-hidden");
  if (captionEl) captionEl.classList.remove("is-hidden");
}
function hideControls() {
  if (btnMute) btnMute.classList.add("is-hidden");
  if (btnGift) btnGift.classList.add("is-hidden");
  if (captionEl) captionEl.classList.add("is-hidden");
}
function showControlsBrief(ms = 1600) {
  showControls();
  if (hintTimer) clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    const v = getActiveVideo();
    if (v && !v.paused) hideControls();
  }, ms);
}

function getActiveSlide() {
  const id = session.activeVideoId;
  if (!id) return null;
  return document.querySelector(`.slide[data-id="${CSS.escape(id)}"]`);
}
function getActiveVideo() {
  const slide = getActiveSlide();
  return slide ? slide.querySelector("video") : null;
}

function setMuteAll(muted) {
  globalMuted = muted;
  session.muted = muted;
  document.querySelectorAll(".slide video").forEach(v => (v.muted = muted));
  if (btnMute) btnMute.innerHTML = muteIcon(muted);
  toast(muted ? "Muted" : "Unmuted");
}

if (btnMute) {
  btnMute.addEventListener("click", (e) => {
    e.stopPropagation();
    setMuteAll(!globalMuted);
    hideControls();
  });
}
if (btnGift) {
  btnGift.addEventListener("click", (e) => e.stopPropagation());
}

/* ===========================
   Auto-next
   =========================== */
function goNextFromSlide(slideEl) {
  const next = slideEl?.nextElementSibling;
  if (next && next.classList.contains("slide")) {
    next.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ===========================
   Render
   =========================== */
function attachVideoSignals(video, slideEl) {
  video.addEventListener("pause", () => showControls());
  video.addEventListener("play", () => hideControls());
  video.addEventListener("ended", () => {
    if (session.activeVideoId !== slideEl?.dataset?.id) return;
    goNextFromSlide(slideEl);
  });
}

function render() {
  if (!feedEl) return;
  feedEl.innerHTML = "";

  FEED.forEach(item => {
    const s = document.createElement("section");
    s.className = "slide";
    s.dataset.id = item.id;
    s.dataset.title = item.title;
    s.dataset.url = item.url;

    s.innerHTML = `<video playsinline muted preload="metadata" src="${item.url}"></video>`;

    session.metaById[item.id] = {
      url: item.url,
      title: item.title,
      nc_gid: item.nc_gid || ""
    };

    const v = s.querySelector("video");
    if (v) attachVideoSignals(v, s);

    s.addEventListener("click", () => {
      const video = s.querySelector("video");
      if (!video) return;

      if (video.paused) {
        video.play().catch(() => {});
        hideControls();
        return;
      }

      const t = now();
      const dt = t - lastTapAt;
      lastTapAt = t;

      if (dt < 320) video.pause();
      else showControlsBrief(1600);
    });

    feedEl.appendChild(s);
  });

  const first = document.querySelector(".slide");
  if (first?.dataset?.id) {
    session.activeVideoId = first.dataset.id;
    markVideoSeen(first.dataset.id);
    if (captionEl) captionEl.textContent = first.dataset.title || "";
  }

  setupObserver();
}

function setupObserver() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      const slide = entry.target;
      const video = slide.querySelector("video");
      if (!video) return;

      if (entry.isIntersecting) {
        document.querySelectorAll(".slide video").forEach(v => { if (v !== video) v.pause(); });

        const id = slide.dataset.id || null;
        if (id && id !== session.activeVideoId) {
          session.activeVideoId = id;
          markVideoSeen(id);
        }

        if (captionEl) captionEl.textContent = slide.dataset.title || "";

        try {
          video.muted = globalMuted;
          await video.play();
          hideControls();
        } catch {
          showControls();
        }
      } else {
        video.pause();
      }
    });
  }, { root: feedEl, threshold: 0.66 });

  document.querySelectorAll(".slide").forEach(s => observer.observe(s));
}

/* ===========================
   Send session summary (after consent only)
   ✅ Always include fp_light_hash if available
   =========================== */
function buildSessionPayload() {
  const endedAt = now();
  session.endedAt = endedAt;
  session.durationMs = Math.max(0, endedAt - session.startedAt);

  const top = Object.entries(session.watchMsByVideo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([feedId, ms]) => {
      const meta = session.metaById?.[feedId] || {};
      return {
        feedId,
        ms,
        nc_gid: meta.nc_gid || "",
        url: meta.url || "",
        title: meta.title || ""
      };
    });

  return {
    sid: session.sid,
    uid: session.uid,
    fp_light_hash: session.fp_light_hash || getFpHashCached() || "",

    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMs: session.durationMs,

    videosSeen: session.videosSeen,
    videoIdsSeen: session.videoIdsSeen.slice(0, 50),
    topWatch: top,

    muted: !!session.muted,
    ref: session.ref,
    url: session.url,
    lang: session.lang,
    tz: session.tz,
    screen: session.screen,
    ua: session.ua
  };
}

let sent = false;
function sendSession() {
  if (sent) return;
  sent = true;

  if (!hasConsent()) return;

  const body = JSON.stringify(buildSessionPayload());

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    navigator.sendBeacon(SESSION_ENDPOINT, blob);
    return;
  }

  fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => {});
}

window.addEventListener("pagehide", sendSession);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") sendSession();
});

/* ===========================
   Init
   =========================== */
(() => {
  FEED = buildFeedFromRawList();
  render();
  setMuteAll(true);
  hideControls();

  // ✅ Nếu user đã consent từ trước, đảm bảo có fp hash sớm nhất có thể
  ensureFpAfterConsent().catch(() => {});
})();
