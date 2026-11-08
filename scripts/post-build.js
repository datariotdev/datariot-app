const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const indexPath = path.join(projectRoot, 'datariot-xyz', 'index.html');
const xyzPath = path.join(projectRoot, 'xyz.html');

try {
  // Read index.html from datariot-xyz
  if (!fs.existsSync(indexPath)) {
    console.error(`Error: ${indexPath} does not exist. Run Expo web export first.`);
    process.exit(1);
  }
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Inject keyframes into index.html for local npx serve support
  const indexResetStyleRegex = /<style id="expo-reset">([\s\S]*?)<\/style>/;
  const indexMatch = indexContent.match(indexResetStyleRegex);
  if (indexMatch && !indexContent.includes('status-pulse-anim')) {
    const keyframes = `
    @keyframes status-pulse {
      0% { transform: scale(0.85); opacity: 0.6; }
      50% { transform: scale(1.45); opacity: 0.2; }
      100% { transform: scale(0.85); opacity: 0.6; }
    }
    .status-pulse-anim {
      animation: status-pulse 2s infinite ease-in-out;
    }
`;
    const newStyleTag = `<style id="expo-reset">${indexMatch[1]}${keyframes}</style>`;
    indexContent = indexContent.replace(indexResetStyleRegex, newStyleTag);
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('Successfully injected custom animations into datariot-xyz/index.html');
  }

  // Find the metro-entry script tag
  const scriptRegex = /<script src="(\/_expo\/static\/js\/web\/metro-entry-[a-f0-9]+\.js)" defer><\/script>/;
  const match = indexContent.match(scriptRegex);

  if (!match) {
    console.error('Error: Could not find metro-entry script tag in datariot-xyz/index.html');
    process.exit(1);
  }

  const newScriptTag = match[0];
  const newScriptUrl = match[1];
  console.log(`Found new bundle script url: ${newScriptUrl}`);

  // Read xyz.html
  if (!fs.existsSync(xyzPath)) {
    console.error(`Error: ${xyzPath} does not exist.`);
    process.exit(1);
  }
  let xyzContent = fs.readFileSync(xyzPath, 'utf8');

  // Replace any existing metro-entry script tag in xyz.html
  const oldScriptRegex = /<script src="\/_expo\/static\/js\/web\/metro-entry-[a-f0-9]+\.js" defer><\/script>/;
  if (!oldScriptRegex.test(xyzContent)) {
    console.error('Error: Could not find old script tag format in xyz.html to replace.');
    process.exit(1);
  }

  xyzContent = xyzContent.replace(oldScriptRegex, newScriptTag);
  fs.writeFileSync(xyzPath, xyzContent, 'utf8');
  console.log('Successfully updated xyz.html with new bundle script path.');
} catch (error) {
  console.error('Failed to post-build sync:', error);
  process.exit(1);
}
