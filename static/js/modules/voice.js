export const voiceState = { isVoice: false };

export function initVoiceInput(micBtn, inputEl) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        micBtn.style.display = 'none';
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;

    let isListening = false;
    let finalTranscript = '';

    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            return;
        }

        // Set language based on selected state if possible, otherwise rely on browser default/Indian english
        // Here we just use a generic config, maybe hi-IN as a broad default for broad Indian accents
        recognition.lang = 'hi-IN'; // You could dynamically update this based on state selector
        recognition.start();
    });

    recognition.onstart = () => {
        isListening = true;
        voiceState.isVoice = true;
        micBtn.classList.add('listening');
        inputEl.placeholder = 'Listening...';
        finalTranscript = inputEl.value; // Store whatever is already typed
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Add a space if concatenating with existing text
        let separator = (finalTranscript && !finalTranscript.endsWith(' ')) ? ' ' : '';
        inputEl.value = finalTranscript + separator + interimTranscript;

        // Trigger auto-resize manually if defined
        inputEl.dispatchEvent(new Event('input'));
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        stopListening();
    };

    recognition.onend = () => {
        stopListening();
    };

    function stopListening() {
        isListening = false;
        micBtn.classList.remove('listening');
        inputEl.placeholder = 'Kuch bhi poochho...';
    }

    inputEl.addEventListener('input', (e) => {
        if (e.isTrusted) voiceState.isVoice = false;
    });
}
