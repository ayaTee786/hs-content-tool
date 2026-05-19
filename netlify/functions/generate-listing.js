// Optimized Netlify serverless function for Handsole Etsy listings
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { images, additionalColors, customNotes } = JSON.parse(event.body);

    if (!images || images.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No images provided' })
      };
    }

    const imageContent = [{
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: images[0]
      }
    }];

    const systemPrompt = `You are Handsole's Etsy expert. Generate SEO listings for handmade leather men's shoes.

BRAND: Upper=full-grain leather, Lining=goat leather, Sole=veg tan leather+rubber, Sizes=US 7-14.5, Widths=E-H, Production=3-10 days, FREE shipping.

RULES: Title 140 chars, product+color FIRST, include "for Men", NO luxury/premium/beautiful. 13 unique tags under 20 chars. Description 700+ words with keywords.

OUTPUT WITH EXACT HEADERS:
## PRODUCT ANALYSIS
[table: style, toe, closure, material, color, lining, hardware, details]
## FOCUS KEYWORD
[single phrase]
## ETSY TITLE
[140 chars]
## ETSY 13 TAGS
[comma-separated]
## DESCRIPTION
[700+ words, • bullets]
## ETSY ATTRIBUTES
[category, colors, material, style]
## IMAGE ALT TEXTS
[comma-separated]
## IMAGE FILE NAMES
[lowercase-hyphens.jpg]
## SKU
[HS-STYLE-COLOR-001]
## SHOP CATEGORY
[single line]
## BEST OCCASIONS
[comma-separated]`;

    let userPrompt = `Analyze this shoe and create a COMPLETE Etsy listing. Look at: style, toe shape, closure, material, colors, lining color, hardware, special details. DO NOT assume - describe what you see!`;

    if (additionalColors) userPrompt += `\nColors available: ${additionalColors}`;
    if (customNotes) userPrompt += `\nNotes: ${customNotes}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: userPrompt }] }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return { statusCode: 500, body: JSON.stringify({ error: 'AI failed', details: err }) };
    }

    const data = await response.json();
    const listing = parseResponse(data.content[0].text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing)
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

function parseResponse(text) {
  const extract = (name) => {
    const m = text.match(new RegExp(`##\\s*${name}[:\\s]*([\\s\\S]*?)(?=\\n##|$)`, 'i'));
    return m?.[1]?.trim() || 'Not generated';
  };
  return {
    productAnalysis: extract('PRODUCT ANALYSIS'),
    focusKeyword: extract('FOCUS KEYWORD'),
    title: extract('ETSY TITLE'),
    tags: extract('ETSY 13 TAGS'),
    description: extract('DESCRIPTION'),
    attributes: extract('ETSY ATTRIBUTES'),
    altTexts: extract('IMAGE ALT TEXTS'),
    fileNames: extract('IMAGE FILE NAMES'),
    sku: extract('SKU'),
    shopCategory: extract('SHOP CATEGORY'),
    occasions: extract('BEST OCCASIONS')
  };
}
