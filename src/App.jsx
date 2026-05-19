import { useState, useCallback } from 'react';
import './App.css';

// Handsole brand constants
const HANDSOLE_CONSTANTS = {
  materials: {
    upper: "Premium full-grain cow crust/aniline leather",
    lining: "Sweat-absorbing, breathable goat leather lining",
    heels: "Vegetable tan leather with rubber heel caps",
    sole: "Stacked handmade vegetable tan leather",
    footbed: "Cushion pad, quilted and padded insole"
  },
  sizing: {
    sizes: "7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5",
    widths: "E (narrow), F (standard), G (wide), H (extra wide)",
    lasts: "Edward (almond), Henry (semi-square), Arthur (round), Winston (apron)"
  },
  production: "3-10 working days",
  shipping: "FREE worldwide shipping",
  returns: "30-day returns, free size exchanges, remakes available"
};

const KEYWORD_DATABASE = {
  styles: {
    oxford: ["oxford shoes", "lace up shoes", "dress shoes", "formal shoes"],
    loafer: ["loafer shoes", "slip on shoes", "mens loafers", "dress loafers"],
    monk: ["monk strap shoes", "buckle shoes", "dress shoes men"],
    chelsea: ["chelsea boots", "ankle boots", "elastic boots", "pull on boots"],
    mule: ["mule shoes", "backless shoes", "slip on mule", "open back shoes"],
    derby: ["derby shoes", "open lacing shoes", "casual dress shoes"],
    brogue: ["brogue shoes", "wingtip shoes", "perforated shoes"],
    wholecut: ["wholecut oxford", "single piece leather", "seamless oxford"]
  },
  materials: {
    leather: ["leather shoes", "genuine leather", "full grain leather", "calfskin"],
    suede: ["suede shoes", "suede leather", "nubuck"],
    croc: ["crocodile embossed", "croc print", "exotic leather", "alligator print"],
    patent: ["patent leather", "glossy leather", "shiny shoes"]
  },
  colors: {
    black: ["black shoes", "black leather", "noir"],
    brown: ["brown shoes", "cognac", "tan", "chocolate"],
    burgundy: ["burgundy shoes", "wine", "oxblood", "maroon"],
    navy: ["navy shoes", "navy blue", "dark blue"],
    grey: ["grey shoes", "gray leather", "charcoal"]
  },
  occasions: ["wedding shoes groom", "groomsmen gift", "business formal", "office wear", "date night"]
};

function App() {
  const [images, setImages] = useState([]);
  const [imageBase64s, setImageBase64s] = useState([]);
  const [productDetails, setProductDetails] = useState({
    additionalColors: '',
    customNotes: ''
  });
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [copiedSection, setCopiedSection] = useState(null);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = [];
    const newBase64s = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push(URL.createObjectURL(file));
        newBase64s.push(event.target.result.split(',')[1]);
        
        if (newImages.length === files.length) {
          setImages(prev => [...prev, ...newImages]);
          setImageBase64s(prev => [...prev, ...newBase64s]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageBase64s(prev => prev.filter((_, i) => i !== index));
  };

  const generateListing = async () => {
    if (imageBase64s.length === 0) {
      setError('Please upload at least one product image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

const response = await fetch('/.netlify/functions/generate-listing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    images: imageBase64s,
    additionalColors: productDetails.additionalColors,
    customNotes: productDetails.customNotes
  }),
  signal: controller.signal
});

clearTimeout(timeoutId);
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate listing');
      }

      const data = await response.json();
      setListing(data);
      setActiveTab('listing');
    } catch (err) {
      setError(err.message || 'An error occurred while generating the listing');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, section) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadListing = () => {
    if (!listing) return;
    
    const content = `
HANDSOLE ETSY LISTING PACKAGE
==============================

PRODUCT ANALYSIS
----------------
${listing.productAnalysis || 'N/A'}

FOCUS KEYWORD
-------------
${listing.focusKeyword || 'N/A'}

ETSY TITLE (${listing.title?.length || 0} chars)
-----------
${listing.title || 'N/A'}

ETSY 13 TAGS
------------
${listing.tags || 'N/A'}

DESCRIPTION
-----------
${listing.description || 'N/A'}

ETSY ATTRIBUTES
---------------
${listing.attributes || 'N/A'}

IMAGE ALT TEXTS
---------------
${listing.altTexts || 'N/A'}

IMAGE FILE NAMES
----------------
${listing.fileNames || 'N/A'}

SKU
---
${listing.sku || 'N/A'}

SHOP CATEGORY
-------------
${listing.shopCategory || 'N/A'}

BEST OCCASIONS
--------------
${listing.occasions || 'N/A'}

---
Generated by Handsole Etsy Listing Generator
AI-generated draft – review and personalize before listing
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handsole-etsy-listing-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">👞</span>
          <h1>Handsole</h1>
          <span className="logo-subtitle">Etsy Listing Generator</span>
        </div>
        <p className="tagline">Transform product images into optimized Etsy listings</p>
      </header>

      <nav className="tabs">
        <button 
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <span className="tab-icon">📷</span>
          Upload
        </button>
        <button 
          className={`tab ${activeTab === 'listing' ? 'active' : ''}`}
          onClick={() => setActiveTab('listing')}
          disabled={!listing}
        >
          <span className="tab-icon">📋</span>
          Listing
        </button>
      </nav>

      <main className="main">
        {activeTab === 'upload' && (
          <div className="upload-section">
            <div className="upload-area">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="file-input"
              />
              <label htmlFor="image-upload" className="upload-label">
                <div className="upload-icon">📸</div>
                <span className="upload-text">Drop product images here or click to upload</span>
                <span className="upload-hint">Upload multiple angles for best results</span>
              </label>
            </div>

            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((img, index) => (
                  <div key={index} className="image-preview">
                    <img src={img} alt={`Product ${index + 1}`} />
                    <button 
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                    <span className="image-number">{index + 1}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="options-section">
              <h3>Additional Options</h3>
              
              <div className="option-group">
                <label htmlFor="additional-colors">Additional Colors Available</label>
                <input
                  type="text"
                  id="additional-colors"
                  placeholder="e.g., Navy Blue, Burgundy, Tan (comma-separated)"
                  value={productDetails.additionalColors}
                  onChange={(e) => setProductDetails(prev => ({
                    ...prev,
                    additionalColors: e.target.value
                  }))}
                />
              </div>

              <div className="option-group">
                <label htmlFor="custom-notes">Custom Notes</label>
                <textarea
                  id="custom-notes"
                  placeholder="Any specific details about this product..."
                  value={productDetails.customNotes}
                  onChange={(e) => setProductDetails(prev => ({
                    ...prev,
                    customNotes: e.target.value
                  }))}
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button 
              className="generate-btn"
              onClick={generateListing}
              disabled={loading || images.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing Images & Generating Listing...
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  Generate Etsy Listing
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'listing' && listing && (
          <div className="listing-section">
            <div className="listing-header">
              <h2>Your Etsy Listing Package</h2>
              <button className="download-btn" onClick={downloadListing}>
                <span>📥</span> Download All
              </button>
            </div>

            <div className="listing-grid">
              <ListingCard
                title="Product Analysis"
                content={listing.productAnalysis}
                onCopy={() => copyToClipboard(listing.productAnalysis, 'analysis')}
                copied={copiedSection === 'analysis'}
              />

              <ListingCard
                title="Focus Keyword"
                content={listing.focusKeyword}
                onCopy={() => copyToClipboard(listing.focusKeyword, 'focus')}
                copied={copiedSection === 'focus'}
                highlight
              />

              <ListingCard
                title={`Etsy Title (${listing.title?.length || 0}/140 chars)`}
                content={listing.title}
                onCopy={() => copyToClipboard(listing.title, 'title')}
                copied={copiedSection === 'title'}
                highlight
              />

              <ListingCard
                title="Etsy 13 Tags"
                content={listing.tags}
                onCopy={() => copyToClipboard(listing.tags, 'tags')}
                copied={copiedSection === 'tags'}
              />

              <ListingCard
                title="Description"
                content={listing.description}
                onCopy={() => copyToClipboard(listing.description, 'description')}
                copied={copiedSection === 'description'}
                large
              />

              <ListingCard
                title="Etsy Attributes"
                content={listing.attributes}
                onCopy={() => copyToClipboard(listing.attributes, 'attributes')}
                copied={copiedSection === 'attributes'}
              />

              <ListingCard
                title="Image Alt Texts"
                content={listing.altTexts}
                onCopy={() => copyToClipboard(listing.altTexts, 'altTexts')}
                copied={copiedSection === 'altTexts'}
              />

              <ListingCard
                title="Image File Names"
                content={listing.fileNames}
                onCopy={() => copyToClipboard(listing.fileNames, 'fileNames')}
                copied={copiedSection === 'fileNames'}
              />

              <ListingCard
                title="SKU"
                content={listing.sku}
                onCopy={() => copyToClipboard(listing.sku, 'sku')}
                copied={copiedSection === 'sku'}
              />

              <ListingCard
                title="Shop Category"
                content={listing.shopCategory}
                onCopy={() => copyToClipboard(listing.shopCategory, 'category')}
                copied={copiedSection === 'category'}
              />

              <ListingCard
                title="Best Occasions"
                content={listing.occasions}
                onCopy={() => copyToClipboard(listing.occasions, 'occasions')}
                copied={copiedSection === 'occasions'}
              />
            </div>

            <div className="disclaimer">
              <span className="disclaimer-icon">ℹ️</span>
              AI-generated draft – review and personalize before listing on Etsy!
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Handsole Etsy Listing Generator • Powered by Claude AI</p>
      </footer>
    </div>
  );
}

function ListingCard({ title, content, onCopy, copied, highlight, large }) {
  return (
    <div className={`listing-card ${highlight ? 'highlight' : ''} ${large ? 'large' : ''}`}>
      <div className="card-header">
        <h3>{title}</h3>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={onCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="card-content">
        <pre>{content}</pre>
      </div>
    </div>
  );
}

export default App;
