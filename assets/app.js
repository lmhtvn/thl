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
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/100_dkj3is7sjzs-1774192406783.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/101_dkcimfos1sh-1774192413257.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/102_dkzevrnslsb-1774192416761.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/103_dkuthjwy9xc-1774192428137.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/104_dkkehgmyrir-1774192431936.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/105_dkhg9lsywd6-1774192435560.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/106_dke9gu-sqsz-1774192439161.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/107_dkcxc4fs9dt-1774192444283.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/108_dj_xcxfsox-1774192448754.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/109_dj6nsm-yglr-1774192453079.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/10_dunospkkiih-1774191747001.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/110_djjda4msv_i-1774192457896.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/111_djbpig8ywru-1774192461337.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/112_djyak9lykva-1774192464608.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/113_djuhlwaybg9-1774192478863.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/114_djtlmybyd-d-1774192482966.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/115_djlrmwqy8ar-1774192498541.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/116_djjt7kcsvtd-1774192502548.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/117_djguebchva4-1774192510824.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/118_djgrxbfhcca-1774192516386.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/119_diyjphhypqd-1774192519777.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/11_duleqi6khsw-1774191760877.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/120_disisehsjxn-1774192522981.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/121_dip3pzzywg0-1774192527167.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/122_diodsz6sz8w-1774192531695.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/123_didwifgyrmc-1774192545863.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/124_dibntavyftm-1774192559682.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/125_dizbisqsv5u-1774192582734.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/126_divttxus3gg-1774192586821.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/127_ditm_pwy0x-1774192590485.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/128_dirxn2fsgbz-1774192593684.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/129_diobo8nyiqd-1774192596356.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/12_dt7ujuqelw3-1774191774727.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/130_dilg7blyaet-1774192611542.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/131_digydwgy-47-1774192615289.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/132_dienp4zybld-1774192628503.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/133_dib7fg4yi8h-1774192631493.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/134_dh_lcjvyk1y-1774192634679.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/135_dh5x5nvsqjt-1774192643651.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/136_dhyzsbgsdtd-1774192646892.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/137_dhv0g9ispof-1774192651155.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/138_dhtdnrayrgb-1774192661592.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/139_dhqyr7yselj-1774192665023.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/13_dt5jzureqpg-1774191777950.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/140_dhn_apqyi_p-1774192669484.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/141_dhnifx6yi3m-1774192679742.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/142_dhlpyzesmgx-1774192684545.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/143_dhirukwsokq-1774192696982.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/144_dha9blxyfyj-1774192700464.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/145_dhyecdwygp3-1774192713980.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/146_dhxwswnyk7h-1774192727896.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/147_dhvxqz3sx-u-1774192731567.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/148_dhtpv8iskbi-1774192735068.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/149_dhnesclyft0-1774192754599.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/14_dtz3se5klgo-1774191784485.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/150_dhgelwesnix-1774192761056.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/151_dhd23kjygk-1774192768613.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/152_dg9udzuye-r-1774192780555.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/153_dg8bnvcys1n-1774192798614.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/154_dg74uiusnds-1774192817780.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/155_dg5kq3qskjn-1774192821942.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/156_dg5oo1ws06p-1774192828903.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/157_dg4qk0rskjm-1774192848810.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/158_dg3ie3fy6o9-1774192863911.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/159_dg27tejycfj-1774192872819.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/15_dtvl-4kknms-1774191790154.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/160_dg2ajtpy8bt-1774192877413.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/161_dg2afkcyx-e-1774192887099.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/162_dg0fr-soxz-1774192900017.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/163_dg0fpzjy-ky-1774192904346.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/164_dg0hvu1si8a-1774192922033.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/165_dgzplx3ytad-1774192933281.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/166_dgx6nkryzq6-1774192937589.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/167_dgxhxuvyloo-1774192944447.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/168_dgxhvirslvm-1774192949156.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/169_dgvizqrsndj-1774192958184.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/16_dtpx4lgkr_b-1774191794680.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/170_dgvixlqy2mo-1774192964492.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/171_dgvitsxsr52-1774192982057.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/172_dgvirbayo-d-1774192998345.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/173_dgus8jashj8-1774193002065.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/174_dgus6fhya74-1774193008311.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/175_dgus4lgyupi-1774193011761.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/176_dgshtwlspip-1774193014966.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/177_dgshrszyubo-1774193022061.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/178_dgshps5sidi-1774193034228.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/179_dgrytc0yqit-1774193038893.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/17_dtnugyhkqnw-1774191798147.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/180_dgpgpsgsc8x-1774193043531.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/181_dgpgm2qy4af-1774193048171.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/182_dgnbvu9spfa-1774193051906.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/183_dgk9duoyqls-1774193056036.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/184_dgihczps9pv-1774193068645.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/185_dghv9h1ypil-1774193072538.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/186_dgei9uuybc-1774193076943.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/18_dtkk_r4kj9l-1774191810359.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/19_dtqay8dklbc-1774191821153.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1878802105114427686-1774877415019.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1889587328722907228-1774877418475.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1891044650435125583-1774877421999.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1896215744112947574-1774877426267.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1902385686101291184-1774877429693.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1904795003903443238-1774877433269.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1907642790693187884-1774877436735.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1908763470201577851-1774877440935.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1911001390929117289-1774877445393.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1919325601225167357-1774877449499.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1920039521762340882-1774877453179.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1920820118889635957-1774877456643.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1921896213156106356-1774877460799.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1924824011378393382-1774877465235.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1929476859948929440-1774877469095.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1934603763328995432-1774877472549.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1936000891087458741-1774877476038.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1937774036089733385-1774877479527.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1938228975823950291-1774877483297.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1939294202002915375-1774877486744.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1940350104663478440-1774877491301.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1942871425284747415-1774877495944.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1944731293184651759-1774877499418.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1945049749956255983-1774877503082.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1945842470794965333-1774877506762.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1949399627868041392-1774877510365.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1950105630200447413-1774877514106.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1951522691472826820-1774877518168.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1953065425597776190-1774877522237.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1955534984783204750-1774877526412.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1957337643043438891-1774877530594.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1960256435054588037-1774877533795.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1965771963437371430-1774877537556.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1968933076761030657-1774877541133.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1973349675299193086-1774877545165.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1973712065089974688-1774877550058.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1975161616279752761-1774877555290.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1978423108592926865-1774877559826.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_1995810178701427025-1774877564131.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_2000891280776368147-1774877569126.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_2002333160449745118-1774877573736.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_2027329771408089177-1774877577251.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_2027577666682155271-1774877580658.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_2029097764345528790-1774877583582.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_2030125422923645312-1774877587550.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/1_dvobn-yeor8-1774191683680.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/20_dtk0jx7eimt-1774191825042.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/21_dtfu997et2y-1774191828779.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/22_dtdd3_degpo-1774191837671.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/23_ds7zsblelni-1774191842150.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/24_ds44l4nesov-1774191846864.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/25_dsr94gfegs0-1774191850905.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/26_dspdoohku79-1774191864912.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/27_dsm031retd4-1774191876300.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/28_dskkww5evhk-1774191880359.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/29_dscevyhkvcf-1774191896200.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/2_1962338549925290276-1774877590727.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/2_2001215793443532908-1774877594445.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/2_dvgve85kj2t-1774191709266.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/30_dsz3ipmkhly-1774191903377.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/31_dsur3wpes-i-1774191916837.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/32_dsskjhxkhxc-1774191923468.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/33_dsnblrheuhk-1774191940454.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/34_dskupyaktdb-1774191953477.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/35_dsh5gz1kotn-1774191957574.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/36_dsfwos2khh8-1774191974032.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/37_dsafmrxkhp4-1774191977464.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/38_dr9amigkqsq-1774191980628.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/39_dr4i6rmki7s-1774191985056.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/3_dvltwdukofs-1774191714640.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/40_dr1zujrktv-1774191989375.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/41_drwrzwlktyo-1774192000495.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/42_drrgkkkkmia-1774192020614.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/43_drpbr69eu1w-1774192024968.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/44_drmbs5eeuj4-1774192029981.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/45_drj4b8tkmtk-1774192039921.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/46_drbidwjega3-1774192044845.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/47_druzpebkjpw-1774192048592.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/48_drr3tj_koef-1774192052228.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/49_drhfcy0eojp-1774192056214.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/4_dvdtbo-evcf-1774191718442.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/50_drfaqkpkoiy-1774192060807.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/51_dqwd-kbeqdo-1774192065108.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/52_dqtyrqxksgj-1774192068100.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/53_dqqxvekeu9v-1774192077128.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/54_dqoirrteokv-1774192085466.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/55_dqytqphegwu-1774192098387.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/56_dqwpblhemlo-1774192110402.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/57_dqvpuypkrpz-1774192115940.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/58_dqt7-tbemsp-1774192127970.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/59_dqqvtyaknrf-1774192142692.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/5_du0sgqcki6t-1774191721436.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/60_dqo2ghdkuf0-1774192147059.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/61_dp_ko1xeiq7-1774192161474.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/62_dp_zeuoem_r-1774192164698.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/63_dp3-tryemb-1774192168242.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/64_dpynm7akki9-1774192178374.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/65_dpijijykqzf-1774192181758.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/66_dpyt6mye9jt-1774192185518.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/67_dptr8zbk2qv-1774192188455.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/68_dogo0erejfs-1774192195301.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/69_dodjrs_kh_u-1774192198335.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/6_duvn3lzetj2-1774191725148.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/70_dod3odjkhqm-1774192201394.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/71_dn9x2oikrte-1774192205006.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/72_dn3fa2p5pix-1774192208147.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/73_dn0yk7ozcxo-1774192215344.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/74_dniu8yly4vm-1774192222048.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/75_dndpdwjsx28-1774192226885.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/76_dnycs53yhjz-1774192230451.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/77_dngcg2nswy1-1774192233919.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/78_dm-vpylyvmd-1774192237565.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/79_dm2smc2ykms-1774192242680.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/7_duk3_6okjrf-1774191735893.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/80_dmnrt8ss5sq-1774192252314.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/81_dmnhb86yl4x-1774192262400.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/82_dmfvwekyqby-1774192272215.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/83_dmxfktzsng9-1774192275940.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/84_dmshsnzy1ht-1774192280251.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/85_dmddkk-y5r-1774192284086.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/86_dl99jn7sskr-1774192302386.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/87_dl7uxbcyoge-1774192320872.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/88_dlxi7ahyrqw-1774192326002.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/89_dlpjkcusadd-1774192338412.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/8_duiijraesza-1774191739064.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/90_dlpi-npym0g-1774192352207.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/91_dluwfzwyo-z-1774192358997.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/92_dlpq-kcyl0h-1774192362262.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/93_dlm8sttyj90-1774192366548.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/94_dlg7oltsfsd-1774192371718.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/95_dlc6tv9salm-1774192383675.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/96_dkzr-zoytmh-1774192387337.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/97_dkqzhojs4t-1774192390779.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/98_dko716_ygd7-1774192393915.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/99_dkmufvgs8m3-1774192403365.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/9_dux0ylykgmo-1774191743463.mp4",
"https://cdn.jsdelivr.net/gh/mxhvn/video-cdn@main/public/epic-01/"
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
const INITIAL_RENDER_COUNT = 10;
const BACKGROUND_APPEND_BATCH = 4;
const BACKGROUND_APPEND_DELAY = 500;
const BACKGROUND_APPEND_TRIGGER_INDEX = 4;
const PRELOAD_ACTIVE_WINDOW = 1;
let renderedCount = 0;
let backgroundAppendStarted = false;
let backgroundAppendTimer = null;

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

function getFeedIndexById(id) {
  return FEED.findIndex(item => item.id === id);
}

function updateVideoPreloadWindow(activeId = session.activeVideoId) {
  if (!activeId) return;

  const activeIndex = getFeedIndexById(activeId);
  if (activeIndex < 0) return;

  document.querySelectorAll(".slide").forEach((slide) => {
    const video = slide.querySelector("video");
    if (!video) return;

    const idx = Number(slide.dataset.index || -1);
    if (idx === activeIndex) {
      video.preload = "auto";
    } else if (Math.abs(idx - activeIndex) <= PRELOAD_ACTIVE_WINDOW) {
      video.preload = "metadata";
    } else {
      video.preload = "none";
    }
  });
}

function scheduleBackgroundAppend() {
  if (backgroundAppendStarted) return;
  backgroundAppendStarted = true;

  const appendNextBatch = () => {
    if (renderedCount >= FEED.length) return;

    appendFeedBatch(BACKGROUND_APPEND_BATCH);

    if (renderedCount < FEED.length) {
      backgroundAppendTimer = setTimeout(appendNextBatch, BACKGROUND_APPEND_DELAY);
    }
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => appendNextBatch(), { timeout: 1200 });
  } else {
    backgroundAppendTimer = setTimeout(appendNextBatch, 300);
  }
}

function maybeStartBackgroundAppend() {
  const activeIndex = getFeedIndexById(session.activeVideoId);
  if (activeIndex >= BACKGROUND_APPEND_TRIGGER_INDEX) {
    scheduleBackgroundAppend();
  }
}

function createSlide(item, index) {
  const s = document.createElement("section");
  s.className = "slide";
  s.dataset.id = item.id;
  s.dataset.index = String(index);
  s.dataset.title = item.title;
  s.dataset.url = item.url;

  s.innerHTML = `<video playsinline muted preload="none" src="${item.url}"></video>`;

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

  return s;
}

function appendFeedBatch(count) {
  if (!feedEl || renderedCount >= FEED.length) return;

  const fragment = document.createDocumentFragment();
  const end = Math.min(renderedCount + count, FEED.length);

  for (let i = renderedCount; i < end; i++) {
    fragment.appendChild(createSlide(FEED[i], i));
  }

  feedEl.appendChild(fragment);
  renderedCount = end;
  setupObserver();
  updateVideoPreloadWindow();
}

function render() {
  if (!feedEl) return;
  if (backgroundAppendTimer) {
    clearTimeout(backgroundAppendTimer);
    backgroundAppendTimer = null;
  }

  feedEl.innerHTML = "";
  renderedCount = 0;
  backgroundAppendStarted = false;

  appendFeedBatch(Math.min(INITIAL_RENDER_COUNT, FEED.length));

  const first = document.querySelector(".slide");
  if (first?.dataset?.id) {
    session.activeVideoId = first.dataset.id;
    markVideoSeen(first.dataset.id);
    if (captionEl) captionEl.textContent = first.dataset.title || "";
  }

  updateVideoPreloadWindow();
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

        updateVideoPreloadWindow(id);
        maybeStartBackgroundAppend();

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
