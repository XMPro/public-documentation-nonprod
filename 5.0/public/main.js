// XMPro Custom JavaScript for DocFX

export default {
  start: () => {
    // Startup script goes here
    // Display description from front matter if present
    setTimeout(() => {
      // Get all description meta tags and use the last one (page-specific)
      const descMetas = document.querySelectorAll('meta[name="description"]');
      const descMeta = descMetas.length > 1 ? descMetas[descMetas.length - 1] : null;
      if (descMeta && descMeta.content && descMeta.content.trim()) {
        const articleH1 = document.querySelector('article h1');
        if (articleH1 && !document.querySelector('.article-description')) {
          const descElem = document.createElement('p');
          descElem.className = 'article-description';
          descElem.textContent = descMeta.content;
          descElem.style.color = '#666';
          descElem.style.marginTop = '-0.5em';
          descElem.style.marginBottom = '1.5em';
          descElem.style.fontSize = '1em';
          
          articleH1.parentNode.insertBefore(descElem, articleH1.nextSibling);
        }
      }
    }, 100);

    // Check if this is a non-production environment and add warning banner
    const hostname = window.location.hostname;
    const isNonProduction = hostname.endsWith('.z13.web.core.windows.net') || 
                            hostname.endsWith('.z19.web.core.windows.net') ||
                            hostname.endsWith('.z22.web.core.windows.net') ||
                            hostname.endsWith('.web.core.windows.net') ||
                            hostname === 'nonprod.documentation.xmpro.com' ||
                            hostname === 'localhost' ||
                            hostname === '127.0.0.1';
    
    if (isNonProduction) {
      // Extract PR number from hostname if possible (format: xmprodocpr123.z13.web.core.windows.net)
      const prMatch = hostname.match(/xmprodocpr(\d+)/);
      const prNumber = prMatch ? prMatch[1] : null;
      
      // Create warning banner
      const banner = document.createElement('div');
      banner.id = 'nonprod-banner';
      banner.className = 'nonprod-banner';
      
      // Banner content
      const bannerContent = `
        <div class="nonprod-banner-content">
          <div class="nonprod-banner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div class="nonprod-banner-text">
            <div class="nonprod-banner-main">
              <strong>NON-PRODUCTION PREVIEW</strong>
              ${prNumber ? `<span class="nonprod-banner-pr">PR #${prNumber}</span>` : ''}
              <span class="nonprod-banner-message">THIS IS A PREVIEW ENVIRONMENT FOR DOCUMENTATION REVIEW. CONTENT MAY NOT BE FINAL.</span>
            </div>
            <a href="https://documentation.xmpro.com/" class="nonprod-banner-link" target="_blank" rel="noopener">View Official Docs</a>
          </div>
        </div>
      `;
      
      banner.innerHTML = bannerContent;
      
      // Add banner to the page
      document.body.insertBefore(banner, document.body.firstChild);
      
      // Add class to body to enable CSS targeting
      document.body.classList.add('has-nonprod-banner');
    }
    
    // Add the switchVersion function to the global scope
    window.switchVersion = function(version) {
      // Check if we're running locally
      const isLocal = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.protocol === 'file:';

      if (isLocal) {
        // If running locally, just stay on the current site
        window.location.href = '/';
        return;
      }

      // Determine environment based on current hostname and path
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      let baseUrl = '';

      if (hostname === 'documentation.xmpro.com') {
        // Production environment with custom domain
        baseUrl = 'https://documentation.xmpro.com';
      } else if (hostname === 'nonprod.documentation.xmpro.com') {
        // Non-production environment with custom domain
        baseUrl = 'https://nonprod.documentation.xmpro.com';
      } else if (hostname === 'xmpro.github.io') {
        // GitHub Pages hosting - determine by repository path
        if (pathname.startsWith('/public-documentation-nonprod/')) {
          // Non-production on GitHub Pages
          baseUrl = 'https://xmpro.github.io/public-documentation-nonprod';
        } else if (pathname.startsWith('/public-documentation/')) {
          // Production on GitHub Pages
          baseUrl = 'https://xmpro.github.io/public-documentation';
        } else {
          console.warn('Unknown GitHub Pages path:', pathname);
          return;
        }
      } else {
        // Unknown environment - stay on current site
        console.warn('Unknown documentation environment:', hostname);
        return;
      }

      // Validate version format (should be X.Y)
      if (!version.match(/^\d+\.\d+$/)) {
        console.warn('Invalid version format:', version, 'Expected format: X.Y (e.g., 4.4, 4.5)');
        return;
      }

      // Navigate to the selected version
      // If we're at root and selecting the latest version, stay at root
      const currentPath = window.location.pathname;
      const isAtRoot = !currentPath.match(/\/\d+\.\d+\//);

      // Navigate to versioned URL
      window.location.href = baseUrl + '/' + version + '/';
    };

    // Add click handlers for images to open them with XMPro favicon
    document.addEventListener('click', function(e) {
      // Check if clicked element is an image inside article content
      if (e.target.tagName === 'IMG' && e.target.closest('article')) {
        e.preventDefault();

        // Get the image source
        let imgSrc = e.target.src;

        // Convert absolute URL to relative path if needed
        if (imgSrc.includes(window.location.origin)) {
          imgSrc = imgSrc.replace(window.location.origin, '');
        }

        // Determine the base path for the site dynamically
        // This handles both local development and GitHub Pages deployment
        let basePath = '';
        const pathname = window.location.pathname;

        // Use regex to match versioned paths like /public-docs-v4.4/, /public-docs-v4.5/, etc.
        const versionedPathMatch = pathname.match(/^\/public-docs-v\d+\.\d+/);

        if (versionedPathMatch) {
          // Extract the matched base path (e.g., /public-docs-v4.4)
          basePath = versionedPathMatch[0];
        } else if (pathname.includes('/public-docs-pages/')) {
          // Keep this for backward compatibility if needed
          basePath = '/public-docs-pages';
        } else if (pathname.includes('/public-docs/')) {
          // Handle non-versioned public-docs path
          basePath = '/public-docs';
        }
        // For local development or root deployment, basePath remains empty

        // Open the image in the custom viewer
        const viewerUrl = basePath + '/src/assets/images/image-viewer.html?image=' + encodeURIComponent(imgSrc);
        window.open(viewerUrl, '_blank');
      }
    });

    // Variable replacement functionality
    loadAndReplaceVariables();
  },
}

// Variable replacement utility - synchronous version
function loadAndReplaceVariables() {
  // Cache the variables to avoid multiple fetches
  let cachedVariables = null;

  function loadVariablesSync() {
    if (cachedVariables) {
      return cachedVariables;
    }
    
    // Determine the path to variables.json based on current URL structure
    // This handles different deployment scenarios (local, versioned, GitHub Pages)
    const currentPath = window.location.pathname;
    let variablesPath = '';
    
    // Check for versioned paths (e.g., /4.5/src/, /public-documentation/4.5/src/)
    const versionMatch = currentPath.match(/\/(\d+\.\d+)\//);
    if (versionMatch) {
      // Extract base path up to and including the version
      const versionPath = currentPath.substring(0, currentPath.indexOf(versionMatch[0]) + versionMatch[0].length);
      variablesPath = versionPath + 'src/variables.json';
    } else {
      // Fallback for development or non-versioned deployments
      variablesPath = '/src/variables.json';
    }
    
    // Use synchronous XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open('GET', variablesPath, false); // false makes it synchronous
    
    try {
      xhr.send();
      
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        
        // Create a copy of all variables from JSON
        cachedVariables = {...data};
        
        // Add derived INSTALL_URL variable
        cachedVariables.INSTALL_URL = (data.INSTALL_URL_PREFIX || 'https://github.com/XMPro/xmpro-windows-installer/releases/download/') + 
                                     (data.VERSION || 'latest') + '/' + 
                                     (data.INSTALLER_SCRIPT || 'install-xmpro.ps1');
      } else {
        throw new Error(`HTTP ${xhr.status}`);
      }
    } catch (error) {
      console.warn('Failed to load variables:', error);
      // Fallback values
      cachedVariables = {
        INSTALL_URL_PREFIX: 'https://github.com/XMPro/xmpro-windows-installer/releases/download/',
        INSTALLER_SCRIPT: 'install-xmpro.ps1',
        VERSION: 'latest',
        ACR_URL: 'xmpro.azurecr.io',
        INSTALL_URL: 'https://github.com/XMPro/xmpro-windows-installer/releases/latest/download/install-xmpro.ps1'
      };
    }
    
    return cachedVariables;
  }

  // Replace variables synchronously
  function replaceVariables() {
    const contentArea = document.querySelector('.content');
    if (!contentArea) {
      console.warn('Content area not found, skipping variable replacement');
      return;
    }
    
    const variables = loadVariablesSync();
    let content = contentArea.innerHTML;
    
    // Replace all variables from the JSON file (including derived INSTALL_URL)
    Object.keys(variables).forEach(key => {
      // Handle plain text placeholders
      const simplePlaceholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(simplePlaceholder, variables[key]);
      
      // Handle DocFX syntax highlighted placeholders: {{<span>KEY</span>}}
      // Allow whitespace/line breaks around the key
      const spanWrappedPlaceholder = new RegExp(
        `\\{\\{\\s*<span[^>]*>\\s*${key}\\s*</span>\\s*\\}\\}`,
        'gis'
      );
      content = content.replace(spanWrappedPlaceholder, variables[key]);
    });
    
    contentArea.innerHTML = content;
  }

  // Initialize - either wait for DOM or run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replaceVariables);
  } else {
    replaceVariables();
  }
}
