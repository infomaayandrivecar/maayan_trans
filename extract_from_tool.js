const fs = require('fs');

const logPath = '/Users/antoanstin/.gemini/antigravity-ide/brain/a47bf03a-d0e8-40ae-a1a5-c5624d1f2aa8/.system_generated/logs/transcript.jsonl';
const logs = fs.readFileSync(logPath, 'utf8').split('\n');

let lastPageCode = "";
let lastBookingCode = "";
let lastLayoutCode = "";

for (const line of logs) {
    if (!line) continue;
    try {
        const entry = JSON.parse(line);
        if (entry.tool_calls) {
            for (const call of entry.tool_calls) {
                if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
                    const args = call.args || {};
                    // if it's write_to_file:
                    if (call.name === 'write_to_file' && args.TargetFile) {
                        if (args.TargetFile.includes('page.tsx')) lastPageCode = args.CodeContent;
                        if (args.TargetFile.includes('BookingContext.tsx')) lastBookingCode = args.CodeContent;
                        if (args.TargetFile.includes('layout.tsx')) lastLayoutCode = args.CodeContent;
                    }
                }
            }
        }
    } catch(e) {}
}

if (lastPageCode) {
    fs.writeFileSync('src/app/page.tsx', lastPageCode);
    console.log(`Restored page.tsx (length: ${lastPageCode.length})`);
}
// We only restore page.tsx since BookingContext and layout might be fine, or we can restore them all.
// Actually, let's restore all 3 from the last write_to_file to be completely sure.
if (lastBookingCode && lastBookingCode.length > 5000) {
    fs.writeFileSync('src/app/context/BookingContext.tsx', lastBookingCode);
    console.log(`Restored BookingContext.tsx (length: ${lastBookingCode.length})`);
}
if (lastLayoutCode && lastLayoutCode.length > 500) {
    fs.writeFileSync('src/app/layout.tsx', lastLayoutCode);
    console.log(`Restored layout.tsx (length: ${lastLayoutCode.length})`);
}
