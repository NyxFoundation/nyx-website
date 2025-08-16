const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function testInlineMath() {
  try {
    // Get the test news page blocks
    const pageId = '251d05af-0d5a-8005-9dfa-ea52a9db2f57';
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });
    
    // Find paragraphs with "math" in them
    response.results.forEach((block, index) => {
      if (block.type === 'paragraph' && block.paragraph.rich_text) {
        const hasEquation = block.paragraph.rich_text.some(rt => rt.type === 'equation');
        const hasMathText = block.paragraph.rich_text.some(rt => 
          rt.plain_text && rt.plain_text.toLowerCase().includes('math')
        );
        
        if (hasEquation || hasMathText) {
          console.log(`\n=== Block ${index} ===`);
          console.log('Type:', block.type);
          console.log('Rich text items:');
          block.paragraph.rich_text.forEach((rt, rtIndex) => {
            console.log(`  [${rtIndex}] Type: ${rt.type}`);
            if (rt.type === 'text') {
              console.log(`      Text: "${rt.plain_text}"`);
              console.log(`      Annotations:`, rt.annotations);
            } else if (rt.type === 'equation') {
              console.log(`      Expression: "${rt.equation.expression}"`);
              console.log(`      Plain text: "${rt.plain_text}"`);
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

testInlineMath();