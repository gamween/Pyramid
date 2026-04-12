const fs = require('fs');
const file = 'apps/web/app/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('import { useState } from "react";', 'import { useState } from "react";\nimport { motion } from "framer-motion";');

fs.writeFileSync(file, content);
