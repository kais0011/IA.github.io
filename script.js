function checkEnter(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value;
    
    if (message) {
        appendMessage('user', message);
        await processMessage(message);
        input.value = '';
    }
}

function appendMessage(sender, message) {
    const chatWindow = document.getElementById('chat-window');
    const messageElement = document.createElement('div');
    messageElement.className = sender + '-message';
    messageElement.textContent = message;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function processMessage(message) {
    const lowerMessage = message.toLowerCase();
    showProgress();

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        let response;

        if (isGreeting(lowerMessage)) {
            response = `مرحبًا! كيف حالك؟ كيف يمكنني مساعدتك اليوم؟`;
        } else {
            const keywords = extractKeywords(message);
            const limitedQueries = splitQuery(keywords.join(' '), 450); // تقسيم النصوص الكبيرة إلى أجزاء أصغر لضمان عدم تجاوز 500 حرف
            const searchResults = await Promise.all(limitedQueries.map(query => searchInternet(query)));

            if (searchResults.length > 0) {
                const combinedResult = searchResults.join(' ');
                response = generateResponse(message, combinedResult);
                const language = detectLanguage(message);
                if (language !== 'en') {
                    response = await translateText(response, language);
                }
            } else {
                response = `لم أجد إجابة مباشرة لسؤالك. هل تود أن أبحث عن شيء آخر أو توضيح السؤال؟`;
            }
        }

        appendMessage('bot', response);
    } catch (error) {
        console.error('Error in processing message:', error);
        appendMessage('bot', 'حدث خطأ أثناء البحث. هل تود تجربة سؤال آخر؟');
    } finally {
        hideProgress();
    }
}

function showProgress() {
    document.getElementById('progress').style.display = 'block';
}

function hideProgress() {
    document.getElementById('progress').style.display = 'none';
}

function isGreeting(message) {
    const greetings = [
        'مرحب', 'سلام', 'hello', 'hi', 'bonjour', 'salut',
        'صباح الخير', 'مساء الخير', 'تحية', 'أهلاً', 'أهلا', 'هاي', 'هلا', 'كيف الحال', 'شخبارك'
    ];
    return greetings.some(greeting => message.includes(greeting));
}

function detectLanguage(message) {
    if (/[\u0600-\u06FF]/.test(message)) return 'ar';
    if (/[A-Za-zÀ-ÿ]/.test(message)) {
        return message.toLowerCase().includes('bonjour') ? 'fr' : 'en';
    }
    return 'en';
}

function extractKeywords(message) {
    return message.toLowerCase().split(' ').filter(word => 
        word.length > 2 && 
        !['هل', 'ما', 'كم', 'ما', 'رأيك', 'تعتقد', 'هو', 'هي', 'أن', 'عن', 'في', 'على', 'من', 'لل', 'بال', 'و'].includes(word)
    );
}

function splitQuery(query, maxLength) {
    const words = query.split(' ');
    const queries = [];
    let currentQuery = '';

    for (const word of words) {
        if ((currentQuery + ' ' + word).length > maxLength) {
            queries.push(currentQuery.trim());
            currentQuery = word;
        } else {
            currentQuery += ' ' + word;
        }
    }

    if (currentQuery) {
        queries.push(currentQuery.trim());
    }

    return queries;
}

async function searchInternet(query) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    try {
        const response = await fetch(searchUrl, {
            mode: 'cors'
        });
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const results = doc.querySelectorAll('.result__snippet');
        
        if (results.length > 0) {
            return Array.from(results).map(result => result.textContent).join(' ').slice(0, 450);  // تقصير النص لتجنب طول الاستعلام الزائد
        }
    } catch (error) {
        console.error('Error searching:', error);
    }
    return '';
}

async function translateText(text, targetLang) {
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
        const data = await response.json();
        return data.responseData.translatedText;
    } catch (error) {
        console.error('Error in translation:', error);
        return text;
    }
}

function generateResponse(question, searchResult) {
    return `بناءً على ما وجدت، ${searchResult}. هل يمكنني مساعدتك في شيء آخر؟`;
}

