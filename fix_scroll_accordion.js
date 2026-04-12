const fs = require('fs');
const file = 'apps/web/components/FeatureShowcase.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `          <motion.div
            key={item.id}
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => setActiveIndex(i)}
            layout`;

const newStr = `          <motion.div
            key={item.id}
            onViewportEnter={() => setActiveIndex(i)}
            viewport={{ margin: "-30% 0px -30% 0px", amount: "some" }}
            onClick={() => setActiveIndex(i)}
            layout`;

content = content.replace(oldStr, newStr);

// Also remove hover pseudo-classes that change the color abruptly on hover
// Change: "bg-[#02040a]/40 hover:bg-[#050a14]/30" to "bg-[#02040a]/40"
content = content.replace(
  `isActive ? (item.activeBg || "bg-[#050a14]") : "bg-[#02040a]/40 hover:bg-[#050a14]/30"`,
  `isActive ? (item.activeBg || "bg-[#050a14]") : "bg-[#02040a]/40"`
);

// Remove group-hover from the ArrowRight that indicates it's clickable
content = content.replace(
  `group-hover:translate-x-2 group-hover:text-white/30`,
  `text-white/10`
);

fs.writeFileSync(file, content);
