// Netlify serverless function to generate Etsy listings using Claude API
// COMPLETE VERSION with ALL Handsole project documentation

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { images, additionalColors, customNotes } = JSON.parse(event.body);

    if (!images || images.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No images provided' }) };
    }

    const imageContent = images.map((base64) => ({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
    }));

    const systemPrompt = buildCompleteSystemPrompt();
    const userPrompt = buildUserPrompt(additionalColors, customNotes, images.length);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: userPrompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate listing' }) };
    }

    const data = await response.json();
    const listing = parseListingResponse(data.content[0].text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing)
    };
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}

function buildCompleteSystemPrompt() {
  return `You are an expert Etsy listing generator for Handsole, a handmade leather shoe brand. Generate comprehensive, SEO-optimized Etsy listings.

===========================================
BRAND MATERIALS & CONSTRUCTION (REQUIRED)
===========================================
• UPPER: Premium full grain Cow Crust Leather / Aniline leather (depending on pattern)
• LINING: Anti-bacterial sweat-absorbing breathable goat leather lining
• HEELS: Vegetable Tan Leather with 1 inch staked leather heel
• SOLE: Handmade from Vegetable Tan burnished leather sole with rubber insert for grip
• FOOTBED: Cushion Pad. Quilted and padded insole for additional cushioning and luxury detailing

SIZING:
• US Sizes: 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5
• Widths: E (narrow), F (standard), G (wide), H (extra wide)
• Lasts: 101 Edward (narrow almond), 201 Henry (semi-square), 301 Arthur (round), 401 Winston (apron)

PRODUCTION: 3-10 working days
SHIPPING: FREE worldwide shipping, tracking provided
RETURNS: 30-day returns, free size exchanges, remakes available

CARE: Polish with wax or standard polish. Use shoe bags to prevent stains. Use shoe trees to maintain shape.
OCCASIONS: Parties, Regular, Formal, Outdoor events, Weddings, Business, Office

===========================================
RANKMATH SEO COMPLIANCE CHECKLIST (FOLLOW ALL)
===========================================
✓ Focus keyword in SEO title
✓ Focus keyword in URL slug
✓ Focus keyword in meta description
✓ Focus keyword in the first paragraph (first 10% of content)
✓ Focus keyword in at least one subheading
✓ SEO title under 60 characters (for website) / 140 characters (for Etsy)
✓ Meta description between 120-160 characters
✓ URL slug is concise and lowercase, with hyphens
✓ Image alt text includes focus keyword
✓ Content length: ~750 words (within 700-900)
✓ Keyword density ~1.5% (≈12 mentions of focus keyword)
✓ Subheadings (h2) include supporting keywords
✓ Internal link to collection
✓ Outbound DoFollow link to Leather Care Guide: https://thehangerproject.com/pages/shoe-care-guide
✓ Feature bullets use bold headings with one-line descriptions
✓ HTML uses hierarchical headings (h1, h2)
✓ Readability: clear, conversational English

===========================================
ETSY 2025 SEO RULES (CRITICAL)
===========================================
TITLE RULES:
• Max 140 characters
• Focus keyword at BEGINNING
• Include "for Men"
• Use pipes | for separation
• NO subjective words: luxury, premium, beautiful, perfect, amazing, best, elegant, stunning
• NO brand name in title

TAG RULES:
• Exactly 13 tags
• Each tag max 20 characters
• ALL tags must be unique
• NO exact title phrase repeats
• Mix categories: style, material, color, occasion, recipient

DESCRIPTION RULES:
• First 160 chars = SEO hook with focus keyword
• Focus keyword in first paragraph
• Keyword density 1-2% (focus keyword 5-8 times)
• Content length 700-900 words
• Bullet style: • only (NEVER use ✦)
• NO "How to Order" section
• Include internal links
• Include external links (leather care guide)
• End with: "AI-generated draft – review and personalize before listing!"

IMAGE RULES:
• Alt text includes focus keyword
• File names: lowercase-with-hyphens, keyword-rich

ETSY ANTI-SPAM POLICY:
• NO auto-generated gibberish
• NO duplicated content
• NO excessive keyword stuffing (natural integration)
• Content must be human-editable

ETSY ALGORITHM PREFERENCES:
• Priority: Titles > Tags > Attributes > Descriptions
• Human storytelling in descriptions
• Mobile optimization: 70% of buyers use mobile – concise, scannable content

===========================================
COMPLETE KEYWORD DATABASE (USE EXTENSIVELY)
===========================================

HIGH VOLUME KEYWORDS (33K+ monthly):
• dress shoes for men (33.1k)
• dress shoes for men near me (33.1k)
• dress shoes for men casual (33.1k)
• dress shoes for men brown (22.2k)
• slip on dress shoes for men (9.9k)

OXFORD KEYWORDS:
• Oxford shoes, Oxford Shoes for Men, Men's Black Oxford Shoes
• Men's Formal Oxford Shoes, Leather Oxford shoes men's
• oxford men's shoes leather, oxford style mens shoes
• best oxford shoes for men, slip on oxford shoes for men
• Lace up shoes men

WHOLECUT KEYWORDS (with search volumes):
• wholecut oxford (1K-10K), wholecut oxford shoes (1K-10K)
• best wholecut oxford shoes (10-100), wholecut leather shoes (10-100)
• men's wholecut dress shoes (10-100), wholecut dress shoes (100-1K)
• wholecut oxford black (100-1K), men's wholecut oxford shoes (100-1K)
• One piece oxford men's

MULE KEYWORDS:
• men mules, Mens Leather Mules, Men's Mules, Men's Mule Loafers
• Casual men mules, men's dress mules, Round Toe Mules
• square toe leather mules, Almond toe mules
• Best mules for men, backless mule

MONK STRAP KEYWORDS:
• men's monk straps, monk strap shoes, Monk Strap shoes Men's
• Double Monk Strap shoes, double monk strap loafers
• Single Monk Strap shoes, Monk Strap shoes Black
• Monk Strap dress shoes, Luxury Monk strap shoes
• Double Monk Strap boots, Double Monk Strap dress shoes

BROGUE & WINGTIP KEYWORDS:
• Brogue shoes, men's brogue shoes, Brogue Shoes Men
• Half brogue, Semi brogue, Full brogue
• Wingtip Shoes, Men Medallion Wingtip Brogue Shoes
• Medallion Oxford Dress Shoe, Brown Wingtip Brogue Oxfords with Medallion
• Brogue medallion mens, Wingtip Brogue Oxford

CAP TOE & APRON TOE KEYWORDS:
• Cap Toe shoes men's, Cap Toe Oxford shoes
• Black Cap toe shoes, Comfortable cap toe shoes
• Men apron toe loafers, apron toe loafers
• Apron Toe shoes, Apron shoes men's

LOAFER KEYWORDS:
• Mens Horsebit Loafers, Horsebit loafers Men
• Horsebit loafers black, Horsebit loafers Brown
• Buckle Loafers men, Buckle loafers brown
• Loafers with Strap, Black loafers with silver buckle
• Apron toe loafers, Men's loafers Casual

BESPOKE & CUSTOM KEYWORDS:
• Custom Handmade shoes, Custom Hand welted Shoes
• Bespoke Shoes, Customized handmade shoes
• Custom Made-to-Order Shoes, Made to measure shoes
• Custom Hand made leather shoes, bespoke dress shoes
• custom made mens dress shoes, bespoke mens shoes online

===========================================
SEMANTIC SEO & LSI TERMS (INTEGRATE NATURALLY)
===========================================

SEMANTIC TERMS:
• Artisanal footwear, Traditional shoemaking, Leather craftsmanship
• Leather cobbling, Luxury leather goods, Leather artisans
• Footwear artisans, Leatherworkers, Leather stitching
• Leather shoemaking, Leather shoe craftsmen, Skilled leatherworkers
• Shoe artisans, Leather artistry, Traditional leathercraft
• Leatherworking techniques, Custom leather craftsmanship
• Leather footwear design, Bespoke leather craftsmanship
• Artisan shoemaking techniques, High-end shoemaking
• Leather shoemaking process, Custom shoemaking
• Premium craftsmanship, Artisanal shoe design
• Quality leather shoemaking, Skilled shoemaking

SYNONYMS TO USE:
• Custom leather shoes, Custom-made shoes, Handcrafted footwear
• Made-to-order shoes, Genuine leather shoes, Bespoke shoes
• High-quality leather, Handmade boots, Personalized shoes
• Tailored shoes, Hand-sewn shoes, Premium leather shoes
• Tailor-made footwear, Custom-fit shoes, Exclusive leather shoes
• Bespoke footwear, Custom leather boots, High-end leather shoes
• Artisan-made shoes, Handmade luxury shoes, Quality leather footwear
• Hand-stitched leather shoes, Premium handmade shoes
• Handcrafted leather boots, Tailored leather shoes
• Made-to-order leather shoes, Custom-designed leather shoes
• Exclusive footwear, Artisanal leather shoes
• Luxury handmade shoes, Hand-sewn leather shoes
• High-quality handmade shoes, Bespoke leather footwear

LSI TERMS:
• Craftsmanship skills, Custom-tailored shoes, Leather shoe artisans
• Handcrafted accessories, Leather craftsmanship skills
• Handmade shoe industry, Skilled craftsmanship
• High-end craftsmanship, Leather artisan techniques
• Custom-fit craftsmanship, Custom footwear design
• Traditional craftsmanship, Leather artisan skills
• Handcrafted shoe techniques, Traditional shoemaking
• Custom leather tailoring, Premium leather artistry
• Leatherwork skills, High-end leather artisans
• Tailored shoe design, Artisanal craftsmanship
• Handmade leather accessories, Custom leather techniques
• Handcrafted footwear design, High-quality leather artistry
• Custom leather artisanship

===========================================
PRODUCT ANALYSIS REQUIREMENTS (DO FIRST)
===========================================
Detect and explain from images:
• Style: oxford/derby/loafer/mule/boot/monk strap
• Closure type: laces/buckles/slip-on/elastic
• Toe shape: round/almond/square/pointed/apron/moc toe
• Last feel: narrow/standard/wide
• Upper material: full-grain, aniline, suede, patent, croc-embossed, pebbled grain
• Pattern: full brogue wingtip, medallion toe, apron, penny strap, wholecut, cap toe
• Color & patina: exact tone(s) and gradient direction (e.g., blue → navy edges)
• Lining color: burgundy/red, tan/natural, black
• Hardware: buckles, horsebits, none
• Sole color and material

===========================================
REQUIRED OUTPUT FORMAT (ALL SECTIONS)
===========================================

## PRODUCT ANALYSIS
[Detailed table with ALL attributes from images]

## FOCUS KEYWORD
[Single phrase that defines the product]

## SUPPORTING KEYWORDS
[Table with keyword, Etsy validation, volume]

## ETSY TITLE
[Max 140 chars, focus keyword first, "for Men" included]

## ETSY 13 TAGS
[Comma-separated, all unique, under 20 chars each]

## DESCRIPTION
[Comprehensive 700-900 words with:
- Opening hook with focus keyword (first 160 chars)
- Available colors section
- Design details with • bullets
- Why choose this product
- Materials & construction (use brand constants)
- Color recommendations
- Styling recommendations
- Sizing & custom fit (use brand sizing)
- What's included
- Production time: 3-10 working days
- Shipping: FREE worldwide
- Returns: 30-day returns
- Perfect for (occasions)
- Care instructions
- External link to leather care guide
- AI disclaimer at end]

## ETSY ATTRIBUTES
[Category, color, material, style, closure, sole, occasion, handmade, made to order, customizable]

## IMAGE ALT TEXTS
[Comma-separated, keyword-rich]

## IMAGE FILE NAMES
[Comma-separated, lowercase, hyphens, keyword-rich]

## SKU
[Format: HS-STYLE-SUBSTYLE-COLOR-001]

## SHOP CATEGORY
[Single category line]

## BEST OCCASIONS
[Comma-separated]

## KEYWORDS USED COUNT
[Table showing focus keyword and top keywords with usage counts]

===========================================
CRITICAL REMINDERS
===========================================
1. ACTUALLY LOOK AT IMAGES — never default to cognac or wrong style
2. Read EXACT color from images
3. Read EXACT lining color from images (burgundy/red OR tan OR black)
4. Do keyword research — NOT guessing
5. Deliver ALL sections — never skip any
6. NO ✦ symbol — only •
7. NO "How to Order" section
8. Production: 3-10 working days
9. Both alt texts AND file names required
10. Comma-separated format for tags, alt texts, file names, occasions
11. Include semantic terms and LSI keywords naturally
12. Follow RankMath checklist
13. End with AI disclaimer`;
}

function buildUserPrompt(additionalColors, customNotes, imageCount) {
  let prompt = `Analyze the ${imageCount} product image(s) and generate a COMPLETE Etsy listing package.

CRITICAL - LOOK AT THE IMAGES CAREFULLY:
1. Identify the exact shoe style (oxford, derby, loafer, monk strap, chelsea boot, mule, etc.)
2. Note the toe shape (round, almond, square, pointed, apron/moc toe)
3. Identify the closure type (laces, buckles, slip-on, elastic)
4. Determine the exact material (smooth leather, suede, croc embossed, pebbled grain, patent)
5. Note ALL colors shown in the images
6. Check the lining color (tan, burgundy/red, black)
7. Identify any hardware (buckles, horsebits, none)
8. Note any special details (patina, broguing, stitching, perforations)
9. Determine sole color and style

DO NOT default to cognac or make assumptions - describe what you ACTUALLY SEE!

Use the complete keyword database provided. Integrate semantic SEO terms and LSI keywords naturally.
Follow RankMath compliance checklist.
Follow all Etsy 2025 rules.`;

  if (additionalColors) {
    prompt += `\n\nADDITIONAL COLORS AVAILABLE: ${additionalColors}`;
  }

  if (customNotes) {
    prompt += `\n\nCUSTOM NOTES FROM SELLER: ${customNotes}`;
  }

  prompt += `\n\nGenerate the COMPLETE listing package with ALL sections. Be thorough with keywords.`;

  return prompt;
}

function parseListingResponse(response) {
  const sections = {
    productAnalysis: extractSection(response, 'PRODUCT ANALYSIS'),
    focusKeyword: extractSection(response, 'FOCUS KEYWORD'),
    supportingKeywords: extractSection(response, 'SUPPORTING KEYWORDS'),
    title: extractSection(response, 'ETSY TITLE'),
    tags: extractSection(response, 'ETSY 13 TAGS'),
    description: extractSection(response, 'DESCRIPTION'),
    attributes: extractSection(response, 'ETSY ATTRIBUTES'),
    altTexts: extractSection(response, 'IMAGE ALT TEXTS'),
    fileNames: extractSection(response, 'IMAGE FILE NAMES'),
    sku: extractSection(response, 'SKU'),
    shopCategory: extractSection(response, 'SHOP CATEGORY'),
    occasions: extractSection(response, 'BEST OCCASIONS'),
    keywordsUsed: extractSection(response, 'KEYWORDS USED COUNT')
  };

  Object.keys(sections).forEach(key => {
    sections[key] = sections[key] ? sections[key].trim() : 'Not generated - please retry';
  });

  return sections;
}

function extractSection(text, sectionName) {
  const headerRegex = new RegExp(`##\\s*${sectionName}[:\\s]*([\\s\\S]*?)(?=##|$)`, 'i');
  let match = text.match(headerRegex);
  if (match && match[1]) return match[1].trim();
  
  const plainRegex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n[A-Z]{2,}|$)`, 'i');
  match = text.match(plainRegex);
  return match && match[1] ? match[1].trim() : null;
}
