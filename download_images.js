const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, 'frontend', 'public', 'images', 'items');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const items = [
    { key: 'hammer', id: 'photo-1586864387967-d02ef85d93e8' },
    { key: 'drill', id: 'photo-1504148455328-c376907d081c' },
    { key: 'screwdriver', id: 'photo-1621905251189-08b45d6a269e' },
    { key: 'ladder', id: 'photo-1601004890684-d8cbf643f5f2' },
    { key: 'pressure_washer', id: 'photo-1608613304899-ea8098577e38' },
    { key: 'projector', id: 'photo-1535016120720-40c646be5580' },
    { key: 'dslr_camera', id: 'photo-1516035069371-29a1b244cc32' },
    { key: 'bluetooth_speaker', id: 'photo-1608043152269-423dbba4e7e1' },
    { key: 'monitor', id: 'photo-1527443224154-c4a3942d3acf' },
    { key: 'power_bank', id: 'photo-1583863788434-e58a36330cf0' },
    { key: 'mixer_grinder', id: 'photo-1578643463396-0997cb5328c1' },
    { key: 'induction_stove', id: 'photo-1584269600464-37b1b58a9fe7' },
    { key: 'air_fryer', id: 'photo-1621972750749-0fbb1abb7736' },
    { key: 'rice_cooker', id: 'photo-1544816155-12df9643f363' },
    { key: 'microwave', id: 'photo-1574269909862-7e1d70bb8078' },
    { key: 'plastic_chairs', id: 'photo-1562184552-997c461abbe6' },
    { key: 'foldable_table', id: 'photo-1533090161767-e6ffed986c88' },
    { key: 'study_table', id: 'photo-1518455027359-f3f8164ba6bd' },
    { key: 'office_chair', id: 'photo-1505797149-43b0069ec26b' },
    { key: 'bookshelf', id: 'photo-1507842217343-583bb7270b66' },
    { key: 'bicycle', id: 'photo-1485965120184-e220f721d03e' },
    { key: 'electric_scooter', id: 'photo-1558981806-ec527fa84c39' },
    { key: 'mountain_bike', id: 'photo-1532298229144-0ec0c57515c7' },
    { key: 'folding_bike', id: 'photo-1541614101331-1a5a3a194e92' },
    { key: 'hybrid_bike', id: 'photo-1517524206127-48bbd363f3d7' },
    { key: 'cricket_kit', id: 'photo-1531415074968-036ba1b575da' },
    { key: 'badminton_set', id: 'photo-1626224583764-f87db24ac4ea' },
    { key: 'football', id: 'photo-1518063319789-7217e6706b04' },
    { key: 'gym_dumbbells', id: 'photo-1638536532686-d610adfc8e5c' },
    { key: 'yoga_mat', id: 'photo-1601925260368-ae2f83cf8b7f' },
    { key: 'engineering_books', id: 'photo-1544716278-ca5e3f4abd8c' },
    { key: 'upsc_books', id: 'photo-1506880018603-83d5b814b5a6' },
    { key: 'ncert_sets', id: 'photo-1497633762265-9d179a990aa6' },
    { key: 'aptitude_books', id: 'photo-1516979187457-637abb4f9353' },
    { key: 'fiction_books', id: 'photo-1543002588-bfa74002ed7e' },
    { key: 'tent', id: 'photo-1504280390367-361c6d9f38f4' },
    { key: 'sleeping_bag', id: 'photo-1510312305653-8ed496efae75' },
    { key: 'camping_stove', id: 'photo-1526253038957-bce54e05968e' },
    { key: 'trekking_pole', id: 'photo-1551632811-561732d1e306' },
    { key: 'camping_lantern', id: 'photo-1517411032315-54ef2cb783bb' },
    { key: 'iron_box', id: 'photo-1489274495757-95c7c837b101' },
    { key: 'vacuum_cleaner', id: 'photo-1558317374-067fb5f30001' },
    { key: 'water_purifier', id: 'photo-1589301760014-d929f3979dbc' },
    { key: 'sewing_machine', id: 'photo-1605647540924-852290f6b0d5' },
    { key: 'pedestal_fan', id: 'photo-1563720223185-11003d516935' },
    { key: 'party_speakers', id: 'photo-1545454675-3531b543be5d' },
    { key: 'decorative_lights', id: 'photo-1513151233558-d860c5398176' },
    { key: 'foldable_canopy', id: 'photo-1561489396-888724a1543d' },
    { key: 'chafing_dish', id: 'photo-1555244162-803834f70033' },
    { key: 'karaoke_mic', id: 'photo-1590602847861-f357a9332bbc' },
];

function downloadImage(item, callback) {
    const dest = path.join(targetDir, `${item.key}.jpg`);
    
    // Check if already exists to prevent unnecessary downloads
    if (fs.existsSync(dest)) {
        console.log(`[SKIP] Already downloaded: ${item.key}.jpg`);
        return callback();
    }

    const url = `https://images.unsplash.com/${item.id}?w=1200&h=1200&fit=crop&q=80`;
    console.log(`[DOWNLOADING] ${item.key} from Unsplash...`);
    
    https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            // Handle redirect
            https.get(response.headers.location, (redirectResponse) => {
                saveResponse(redirectResponse, dest, item, callback);
            }).on('error', (err) => {
                console.error(`[ERROR] Redirect error for ${item.key}:`, err.message);
                callback();
            });
        } else {
            saveResponse(response, dest, item, callback);
        }
    }).on('error', (err) => {
        console.error(`[ERROR] Request failed for ${item.key}:`, err.message);
        callback();
    });
}

function saveResponse(response, dest, item, callback) {
    if (response.statusCode !== 200) {
        console.error(`[FAILED] status code ${response.statusCode} for ${item.key}`);
        return callback();
    }

    const fileStream = fs.createWriteStream(dest);
    response.pipe(fileStream);

    fileStream.on('finish', () => {
        fileStream.close();
        console.log(`[SUCCESS] Saved: ${item.key}.jpg`);
        callback();
    });

    fileStream.on('error', (err) => {
        fs.unlink(dest, () => {});
        console.error(`[ERROR] File stream error for ${item.key}:`, err.message);
        callback();
    });
}

// Download queue controller (concurrency = 5)
let activeCount = 0;
let index = 0;

function next() {
    if (index === items.length && activeCount === 0) {
        console.log('\n[DONE] All images processed successfully!');
        return;
    }

    while (activeCount < 5 && index < items.length) {
        const item = items[index++];
        activeCount++;
        downloadImage(item, () => {
            activeCount--;
            next();
        });
    }
}

console.log(`Starting download of ${items.length} images to ${targetDir}...\n`);
next();
