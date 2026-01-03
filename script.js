document.addEventListener('DOMContentLoaded', () => {
    // 0. Security Utilities (Obfuscation)
    const salt = "luminous-v30-secure-core";
    const e = (t) => btoa(t.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))).join(''));
    const d = (t) => {
        try { return atob(t).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))).join(''); }
        catch (e) { return ''; }
    };

    // 1. Selector Cache
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const toggleIconPath = document.getElementById('toggle-icon-path');
    const resizer = document.getElementById('sidebar-resizer');
    const textArea = document.getElementById('chat-textarea');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages');
    const welcomeHero = document.getElementById('welcome-hero');
    const apiModal = document.getElementById('api-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key');

    // Theme Selector
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconPath = document.getElementById('theme-icon-path');

    // System Prompt Selectors
    const personaTrigger = document.getElementById('persona-trigger');
    const promptModal = document.getElementById('prompt-modal');
    const promptInput = document.getElementById('system-prompt-input');
    const savePromptBtn = document.getElementById('save-prompt');
    const closePromptBtn = document.getElementById('close-prompt');

    // Sampling Modal Selectors
    const tuningTrigger = document.getElementById('tuning-trigger');
    const samplingModal = document.getElementById('sampling-modal');
    const closeSamplingBtn = document.getElementById('close-sampling');
    const saveSamplingBtn = document.getElementById('save-sampling');

    // Sampling Parameter Selectors
    const tempSlider = document.getElementById('temp-slider');
    const tempVal = document.getElementById('temp-val');
    const topPSlider = document.getElementById('top-p-slider');
    const topPVal = document.getElementById('top-p-val');
    const maxTokensSlider = document.getElementById('max-tokens-slider');
    const maxTokensVal = document.getElementById('max-tokens-val');
    const presencePenaltySlider = document.getElementById('presence-penalty-slider');
    const presencePenaltyVal = document.getElementById('presence-penalty-val');
    const repetitionPenaltySlider = document.getElementById('repetition-penalty-slider');
    const repetitionPenaltyVal = document.getElementById('repetition-penalty-val');

    // Model Selection Selectors
    const modelTrigger = document.getElementById('model-trigger');
    const modelModal = document.getElementById('model-modal');
    const closeModelBtn = document.getElementById('close-model');
    const modelOptions = document.querySelectorAll('.model-option');
    const currentModelDisplay = document.getElementById('current-model-display');

    // Carousel Selectors
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselPrev = document.getElementById('carousel-prev');
    const carouselNext = document.getElementById('carousel-next');
    const carouselDots = document.querySelectorAll('.carousel-dots .dot');

    const clearApiTrigger = document.getElementById('clear-api-trigger');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const mobileToggle = document.getElementById('mobile-toggle');

    const resetPromptBtn = document.getElementById('reset-prompt');
    const resetSamplingBtn = document.getElementById('reset-sampling');

    // 2. Application State - SELECTIVE PERSISTENCE
    // Targeted cleanup of ephemeral data
    ['hyperchat_chat_history', 'hyperchat_chat_system_prompt', 'hyperchat_selected_model', 'hyperchat_selected_model_name'].forEach(k => localStorage.removeItem(k));

    let encryptedKey = localStorage.getItem('hyperchat_api_key_secure');
    let apiKey = encryptedKey ? d(encryptedKey) : '';
    let chatHistory = [];
    let systemPrompt = '';

    let selectedModel = 'openai/gpt-oss-120b';
    let selectedModelName = 'GPT OSS 120B';

    // Default Parameters (Sampling Sync)
    let samplingParams = {
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 2048,
        presence_penalty: 0.0,
        repetition_penalty: 1.0
    };

    let isGenerating = false;

    // Load session
    if (apiKey) {
        apiModal.classList.remove('open');
        setTimeout(() => apiModal.style.display = 'none', 300);
    }

    // Initialize Theme (Default to light)
    document.documentElement.classList.remove('dark');
    themeIconPath.setAttribute('d', 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z');

    // Load persisted prompt
    if (systemPrompt) {
        promptInput.value = systemPrompt;
    }

    // Initialize Model UI
    currentModelDisplay.textContent = selectedModelName;
    modelOptions.forEach(opt => {
        if (opt.dataset.model === selectedModel) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    // Auto-collapse for mobile on load
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('sidebar-expanded');
        sidebar.classList.add('sidebar-collapsed');
        toggleIconPath.setAttribute('d', 'M9 6l6 6-6 6');
    }

    // 3. Resizable Navigation Rail Logic
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        sidebar.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        let newWidth = e.clientX;

        if (newWidth < 120) {
            sidebar.classList.remove('sidebar-expanded');
            sidebar.classList.add('sidebar-collapsed');
            sidebar.style.width = '';
            toggleIconPath.setAttribute('d', 'M9 6l6 6-6 6');
        } else if (window.innerWidth > 768 && newWidth >= 240 && newWidth <= 480) {
            sidebar.classList.remove('sidebar-collapsed');
            sidebar.classList.add('sidebar-expanded');
            sidebar.style.width = `${newWidth}px`;
            toggleIconPath.setAttribute('d', 'M15 6l-6 6 6 6');
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            sidebar.classList.remove('resizing');
            document.body.style.cursor = 'default';
        }
    });

    [sidebarToggle, mobileToggle].forEach(btn => {
        btn?.addEventListener('click', () => {
            const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
            sidebar.style.width = '';

            if (isCollapsed) {
                sidebar.classList.remove('sidebar-collapsed');
                sidebar.classList.add('sidebar-expanded');
                toggleIconPath.setAttribute('d', 'M15 6l-6 6 6 6');
            } else {
                sidebar.classList.remove('sidebar-expanded');
                sidebar.classList.add('sidebar-collapsed');
                toggleIconPath.setAttribute('d', 'M9 6l6 6-6 6');
            }
        });
    });

    // 4. Configuration Event Listeners
    tempSlider.addEventListener('input', (e) => {
        samplingParams.temperature = parseFloat(e.target.value);
        tempVal.textContent = samplingParams.temperature.toFixed(1);
    });

    topPSlider.addEventListener('input', (e) => {
        samplingParams.top_p = parseFloat(e.target.value);
        topPVal.textContent = samplingParams.top_p.toFixed(2);
    });

    maxTokensSlider.addEventListener('input', (e) => {
        samplingParams.max_tokens = parseInt(e.target.value);
        maxTokensVal.textContent = samplingParams.max_tokens;
    });

    presencePenaltySlider.addEventListener('input', (e) => {
        samplingParams.presence_penalty = parseFloat(e.target.value);
        presencePenaltyVal.textContent = samplingParams.presence_penalty.toFixed(1);
    });

    repetitionPenaltySlider.addEventListener('input', (e) => {
        samplingParams.repetition_penalty = parseFloat(e.target.value);
        repetitionPenaltyVal.textContent = samplingParams.repetition_penalty.toFixed(1);
    });

    saveApiKeyBtn.addEventListener('click', () => {
        const val = apiKeyInput.value.trim();
        if (val) {
            apiKey = val;
            localStorage.setItem('hyperchat_api_key_secure', e(apiKey));
            apiModal.classList.remove('open');
            setTimeout(() => apiModal.style.display = 'none', 300);
        }
    });

    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isDark = document.documentElement.classList.toggle('dark');

        if (isDark) {
            themeIconPath.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z');
        } else {
            themeIconPath.setAttribute('d', 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z');
        }
    });

    // Model Selection Logic
    modelTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        modelModal.style.display = 'flex';
        setTimeout(() => modelModal.classList.add('open'), 10);
    });

    closeModelBtn.addEventListener('click', () => {
        modelModal.classList.remove('open');
        setTimeout(() => modelModal.style.display = 'none', 300);
    });

    modelOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedModel = option.dataset.model;
            selectedModelName = option.dataset.name;

            // Update UI
            currentModelDisplay.textContent = selectedModelName;
            modelOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Close modal
            modelModal.classList.remove('open');
            setTimeout(() => modelModal.style.display = 'none', 300);

            // Auto-reset chat on model change
            if (chatHistory.length > 0) {
                chatHistory = [];
                messagesContainer.innerHTML = '';
                if (welcomeHero) welcomeHero.classList.remove('hidden');
                if (clearChatBtn) clearChatBtn.classList.remove('visible');
            }
        });
    });

    // 4.1 Carousel Logic (Directive M - Seamless Infinite)
    if (carouselTrack) {
        // Initialize position to the first real slide (index 1)
        const initCarousel = () => {
            const width = carouselTrack.clientWidth;
            if (width > 0) {
                carouselTrack.scrollTo({ left: width, behavior: 'auto' });
            } else {
                // Retry if layout isn't ready
                requestAnimationFrame(initCarousel);
            }
        };
        initCarousel();

        const updateDots = () => {
            const width = carouselTrack.clientWidth;
            if (width === 0) return;

            // index 0 is clone of Slide 4, index 1 is real Slide 1
            let index = Math.round(carouselTrack.scrollLeft / width) - 1;

            // Wrap index for dots (Slide 1-4)
            if (index < 0) index = 3;
            if (index > 3) index = 0;

            carouselDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        const scrollCarousel = (direction) => {
            const width = carouselTrack.clientWidth;
            carouselTrack.scrollBy({ left: direction * width, behavior: 'smooth' });
        };

        // Seamless Jump Logic
        carouselTrack.addEventListener('scroll', () => {
            const width = carouselTrack.clientWidth;
            const scrollPos = carouselTrack.scrollLeft;
            const maxScroll = carouselTrack.scrollWidth - width;

            // Instant jump when reaching clones
            if (scrollPos <= 0) {
                // At Clone 4 (index 0) -> Jump to Real 4 (index 4)
                carouselTrack.style.scrollBehavior = 'auto';
                carouselTrack.scrollLeft = maxScroll - width;
                carouselTrack.style.scrollBehavior = 'smooth';
            } else if (scrollPos >= maxScroll - 2) { // 2px buffer for rounding
                // At Clone 1 (index 5) -> Jump to Real 1 (index 1)
                carouselTrack.style.scrollBehavior = 'auto';
                carouselTrack.scrollLeft = width;
                carouselTrack.style.scrollBehavior = 'smooth';
            }

            updateDots();
        });

        // carouselPrev?.addEventListener('click', () => scrollCarousel(-1));
        // carouselNext?.addEventListener('click', () => scrollCarousel(1));

        carouselDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                // Dots map to index 1, 2, 3, 4
                carouselTrack.scrollTo({ left: (i + 1) * carouselTrack.clientWidth, behavior: 'smooth' });
            });
        });
    }

    // 4.2 Cleanup Actions
    clearApiTrigger?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to clear your API key? This will require a re-authorization.')) {
            localStorage.removeItem('hyperchat_api_key_secure');
            apiKey = '';
            location.reload();
        }
    });

    clearChatBtn?.addEventListener('click', () => {
        if (confirm('Clear current conversation?')) {
            chatHistory = [];
            messagesContainer.innerHTML = '';

            // Re-append Hero if it was removed
            if (!document.getElementById('welcome-hero')) {
                const heroMarkup = `
                    <div id="welcome-hero">
                        <div class="carousel-viewport">
                            <div class="carousel-track">
                                <!-- Slides handled by CSS scroll-snap, simplified for re-injection if needed, 
                                     but usually it's better to just reload or keep it in DOM hidden. 
                                     Since we remove() it, we'll just reload for a true 'clear' feel 
                                     or just re-inject the static structure. -->
                            </div>
                        </div>
                    </div>`;
                // To keep it simple and robust, let's just restore the hero content
                // Actually, a page reload is the cleanest 'ephemeral' way, 
                // but let's try a DOM reset first.
                location.reload();
            } else {
                welcomeHero.classList.remove('hidden');
                clearChatBtn.classList.remove('visible');
            }
        }
    });

    resetPromptBtn?.addEventListener('click', () => {
        promptInput.value = '';
        systemPrompt = '';
        alert('Persona reset to default.');
    });

    resetSamplingBtn?.addEventListener('click', () => {
        samplingParams = {
            temperature: 1.0,
            top_p: 1.0,
            max_tokens: 2048,
            presence_penalty: 0.0,
            repetition_penalty: 1.0
        };

        // Update UI
        tempSlider.value = 1.0;
        tempVal.textContent = '1.0';
        topPSlider.value = 1.0;
        topPVal.textContent = '1.00';
        maxTokensSlider.value = 2048;
        maxTokensVal.textContent = '2048';
        presencePenaltySlider.value = 0.0;
        presencePenaltyVal.textContent = '0.0';
        repetitionPenaltySlider.value = 1.0;
        repetitionPenaltyVal.textContent = '1.0';

        alert('Sampling parameters reset to default.');
    });

    // Persona / System Prompt Management
    personaTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        promptModal.style.display = 'flex';
        setTimeout(() => promptModal.classList.add('open'), 10);
    });

    closePromptBtn.addEventListener('click', () => {
        promptModal.classList.remove('open');
        setTimeout(() => promptModal.style.display = 'none', 300);
    });

    savePromptBtn.addEventListener('click', () => {
        const newPrompt = promptInput.value.trim();
        // Reset only if content changed or forced reset requested (simpler to just reset always per user request)
        systemPrompt = newPrompt;

        // Reset Chat History
        chatHistory = [];
        messagesContainer.innerHTML = '';

        promptModal.classList.remove('open');
        setTimeout(() => promptModal.style.display = 'none', 300);
    });

    // Sampling Modal Management
    tuningTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        samplingModal.style.display = 'flex';
        setTimeout(() => samplingModal.classList.add('open'), 10);
    });

    closeSamplingBtn.addEventListener('click', () => {
        samplingModal.classList.remove('open');
        setTimeout(() => samplingModal.style.display = 'none', 300);
    });

    saveSamplingBtn.addEventListener('click', () => {
        samplingModal.classList.remove('open');
        setTimeout(() => samplingModal.style.display = 'none', 300);
    });

    // Close modal on backdrop click
    window.addEventListener('click', (e) => {
        if (e.target === promptModal) {
            promptModal.classList.remove('open');
            setTimeout(() => promptModal.style.display = 'none', 300);
        }
        if (e.target === samplingModal) {
            samplingModal.classList.remove('open');
            setTimeout(() => samplingModal.style.display = 'none', 300);
        }
        if (e.target === apiModal && apiKey) {
            apiModal.classList.remove('open');
            setTimeout(() => apiModal.style.display = 'none', 300);
        }
    });

    // 5. Chat Interaction Core (Luminous v30.0 Stream)
    async function sendMessage() {
        if (isGenerating || !apiKey) return;
        const content = textArea.value.trim();
        if (!content) return;

        isGenerating = true;
        updateUIState(true);

        textArea.value = '';
        textArea.style.height = 'auto';

        // Hide Welcome Hero on first message
        if (welcomeHero) {
            welcomeHero.classList.add('hidden');
            setTimeout(() => {
                if (welcomeHero.parentNode) {
                    welcomeHero.remove();
                }
            }, 500);
        }

        // Show Clear Chat button
        if (clearChatBtn) clearChatBtn.classList.add('visible');

        // User Message Row
        appendMessage('User', content, 'user');
        chatHistory.push({ role: 'user', content: content });

        // Bot Message Row (Hardware Surface styling)
        const botMsgDiv = appendMessage('Assistant', '', 'bot');
        const contentDiv = botMsgDiv.querySelector('.message-content');

        // Prepare sub-containers for reasoning vs actual content
        contentDiv.innerHTML = `
            <div class="thought-container-wrapper"></div>
            <div class="actual-content-wrapper"></div>
        `;
        const thoughtWrapper = contentDiv.querySelector('.thought-container-wrapper');
        const mainWrapper = contentDiv.querySelector('.actual-content-wrapper');

        // Initial Thinking State
        botMsgDiv.classList.add('thinking');

        const apiMessages = [];
        if (systemPrompt) apiMessages.push({ role: "system", content: systemPrompt });

        // Sanitize history: Filter out empty/broken messages that cause "unexpected tokens" errors
        const context = chatHistory
            .slice(-10)
            .filter(m => m.content && m.content.trim() !== '') // CRITICAL FIX
            .map(m => ({ role: m.role, content: m.content }));

        apiMessages.push(...context);

        console.log("Sending Payload:", JSON.stringify(apiMessages, null, 2)); // Debug payload

        try {
            const response = await fetch("https://console.hyperstack.cloud/ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: apiMessages,
                    stream: true,
                    ...samplingParams
                })
            });

            if (!response.ok) throw new Error('Failed to reach AI cluster.');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedReasoning = '';
            let accumulatedContent = '';
            let buffer = '';
            let debugLines = []; // Capture first few lines for visible debugging

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep partial line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    // Capture debug info
                    if (debugLines.length < 5) debugLines.push(trimmed.substring(0, 100));

                    if (!trimmed.startsWith('data:')) continue;

                    const dataStr = trimmed.slice(5).trim(); // Remove 'data:'
                    if (dataStr === '[DONE]') break;

                    try {
                        const json = JSON.parse(dataStr);

                        // Check for API Error Payload
                        if (json.error) {
                            throw new Error(`API Error: ${json.error.message || JSON.stringify(json.error)}`);
                        }

                        const delta = json.choices?.[0]?.delta;
                        if (!delta) continue;

                        if (delta.reasoning_content) accumulatedReasoning += delta.reasoning_content;
                        if (delta.content) accumulatedContent += delta.content;

                        // Render immediately
                        if (accumulatedReasoning) {
                            if (!thoughtWrapper.innerHTML) {
                                thoughtWrapper.innerHTML = `
                                    <div class="thought-container">
                                        <button class="thought-header">
                                            <span>Thought Process</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                        </button>
                                        <div class="thought-content">
                                            <div class="thought-inner"></div>
                                        </div>
                                    </div>`;
                            }
                            const inner = thoughtWrapper.querySelector('.thought-inner');
                            if (inner) inner.innerHTML = formatMarkdown(accumulatedReasoning);
                        }

                        if (accumulatedContent) {
                            botMsgDiv.classList.remove('thinking');
                            mainWrapper.innerHTML = formatMarkdown(accumulatedContent);
                        }

                        if (accumulatedReasoning || accumulatedContent) {
                            scrollToBottom();
                        }

                    } catch (e) {
                        console.error("JSON Parse Error:", e);
                        // If it's a real API error, show it
                        if (e.message.startsWith('API Error')) {
                            contentDiv.innerHTML = `<span style="color: var(--color-rose-500); font-weight: bold;">${e.message}</span>`;
                            return; // Stop processing
                        }
                    }
                }
            }

            // Flush buffer (process last line if any)
            if (buffer.trim().startsWith('data:')) {
                try {
                    const dataStr = buffer.trim().slice(5).trim();
                    if (dataStr !== '[DONE]') {
                        const json = JSON.parse(dataStr);
                        const delta = json.choices?.[0]?.delta;
                        // Final Render
                        if (accumulatedReasoning) {
                            if (!thoughtWrapper.innerHTML) {
                                thoughtWrapper.innerHTML = `
                                        <div class="thought-container">
                                            <button class="thought-header">
                                                <span>Thought Process</span>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                            </button>
                                            <div class="thought-content">
                                                <div class="thought-inner"></div>
                                            </div>
                                        </div>`;
                            }
                            const inner = thoughtWrapper.querySelector('.thought-inner');
                            if (inner) inner.innerHTML = formatMarkdown(accumulatedReasoning);
                        }

                        if (accumulatedContent) {
                            mainWrapper.innerHTML = formatMarkdown(accumulatedContent);
                        }

                        scrollToBottom();
                    }
                } catch (e) { }
            }

            if (!accumulatedReasoning && !accumulatedContent) {
                mainWrapper.innerHTML = `<span style="color: var(--color-slate-400); font-style: italic;">[No content received]</span>`;
            }

            chatHistory.push({ role: 'assistant', content: accumulatedContent }); // Save final content

        } catch (error) {
            mainWrapper.innerHTML = `<span style="color: var(--color-rose-500)">ERR_LINK_FAILED: ${error.message}</span>`;
            console.error("Chat Error:", error);
        } finally {
            isGenerating = false;
            updateUIState(false);
        }
    }

    messagesContainer.addEventListener('click', (e) => {
        const header = e.target.closest('.thought-header');
        if (header) {
            const container = header.closest('.thought-container');
            if (container) {
                container.classList.toggle('expanded');
            }
        }
    });

    // Handle Autoscroll on Image Load
    messagesContainer.addEventListener('load', (e) => {
        if (e.target.tagName === 'IMG') {
            scrollToBottom('smooth');
        }
    }, true); // Use capture phase because 'load' doesn't bubble

    function scrollToBottom(behavior = 'auto') {
        const messages = document.getElementById('messages');
        if (!messages) return;

        requestAnimationFrame(() => {
            messages.scrollTo({
                top: messages.scrollHeight,
                behavior: behavior
            });
        });
    }

    function appendMessage(sender, text, type) {
        const row = document.createElement('div');
        row.className = `message-row ${type}-message`;

        let avatarMarkup = '';
        if (type === 'bot') {
            avatarMarkup = `
                <div class="avatar-wrapper">
                    <div class="avatar-orbit"></div>
                    <div class="avatar" style="display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.75rem;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                </div>`;
        } else {
            avatarMarkup = `
                <div class="avatar-wrapper">
                    <div class="avatar" style="display: flex; align-items: center; justify-content: center; color: var(--content-muted); font-weight: 800; font-size: 0.75rem;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                </div>`;
        }

        row.innerHTML = `
            ${avatarMarkup}
            <div class="message-content">
                ${formatMarkdown(text)}
            </div>
        `;

        messagesContainer.appendChild(row);
        scrollToBottom('smooth');
        return row;
    }

    function updateUIState(loading) {
        sendBtn.disabled = loading;
        sendBtn.style.opacity = loading ? '0.5' : '1';
        if (loading) {
            sendBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="animate-spin"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>`;
        } else {
            sendBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        }
    }

    function formatMarkdown(text) {
        if (!text) return '';
        // Use marked.js if available, otherwise fallback to basic
        if (typeof marked !== 'undefined') {
            return marked.parse(text, { breaks: true });
        }
        // Basic fallback
        return text.replace(/\n/g, '<br>');
    }

    // Auto-resize textarea
    textArea.addEventListener('input', () => {
        textArea.style.height = 'auto';
        textArea.style.height = (textArea.scrollHeight) + 'px';
    });

    textArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // 6. Mobile Keyboard Stability (Visual Viewport Sync)
    if (window.visualViewport) {
        const chatInputArea = document.getElementById('chat-input-area');

        const syncViewport = () => {
            if (window.innerWidth <= 768) {
                // Calculate the offset from the bottom of the layout viewport
                const offset = window.innerHeight - window.visualViewport.height;

                // Only move if keyboard height is significant (> 10px) to avoid jitter
                if (offset > 10) {
                    chatInputArea.style.transform = `translateY(-${offset}px)`;
                } else {
                    chatInputArea.style.transform = 'translateY(0)';
                }
            } else {
                chatInputArea.style.transform = '';
            }
        };

        window.visualViewport.addEventListener('resize', syncViewport);
        window.visualViewport.addEventListener('scroll', syncViewport);
    }
});
