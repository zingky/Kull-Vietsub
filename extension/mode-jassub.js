(function() {
    if (!window.Aegi || !window.Aegi.settings.useLibass) return;

    let isIframeReady = false;
    let pendingSubContent = null;

    window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'iframe_ready') {
            isIframeReady = true;
            if (pendingSubContent) {
                // TRUYỀN THÊM FONT URL ĐỂ JASSUB CÓ CÁI VẼ CHỮ
                sendToIframe({ 
                    type: 'init', 
                    content: pendingSubContent,
                    workerUrl: chrome.runtime.getURL('lib/jassub.worker.min.js'),
                    wasmUrl: chrome.runtime.getURL('lib/worker.min.wasm'),
                    fontUrl: chrome.runtime.getURL('vnf-comic-sans.ttf')
                });
                pendingSubContent = null;
            }
        }
    });

    function sendToIframe(data) {
        const iframe = document.getElementById('jassub-iframe-core');
        if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage(data, '*');
    }

    function setupExternalBox() {
        let container = document.getElementById('jassub-external-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'jassub-external-container';
            Object.assign(container.style, {
                position: 'fixed', bottom: '20px', left: '20px', width: '500px', height: '281px',
                backgroundColor: '#000', border: '2px solid #00ffaa', zIndex: '999999',
                boxShadow: '0 0 15px rgba(0,255,170,0.5)', borderRadius: '8px', overflow: 'hidden'
            });
            container.innerHTML = `
                <div style="background:#00ffaa; color:#000; font-size:10px; font-weight:bold; padding:2px 5px; position:absolute; top:0; left:0; z-index:10;">JASSUB ENGINE</div>
                <iframe id="jassub-iframe-core" src="${chrome.runtime.getURL('jassub-renderer.html')}" style="width:100%; height:100%; border:none; background:transparent;"></iframe>
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    window.onAegiDataReady = () => { 
        setupExternalBox();
        if (window.Aegi.rawAss) {
            if (isIframeReady) {
                sendToIframe({ 
                    type: 'init', 
                    content: window.Aegi.rawAss,
                    workerUrl: chrome.runtime.getURL('lib/jassub.worker.min.js'),
                    wasmUrl: chrome.runtime.getURL('lib/worker.min.wasm'),
                    fontUrl: chrome.runtime.getURL('vnf-comic-sans.ttf')
                });
            } else {
                pendingSubContent = window.Aegi.rawAss;
            }
        }
    };

    function jassubSyncLoop() {
        const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
        if (video && isIframeReady) {
            sendToIframe({ type: 'time', currentTime: video.currentTime });
        }
        requestAnimationFrame(jassubSyncLoop);
    }
    
    requestAnimationFrame(jassubSyncLoop);
})();