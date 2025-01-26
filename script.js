// اسم البوت
const BOT_NAME = {
    ar: "مساعدك الذكي",
    fr: "Votre Assistant Intelligent",
    en: "Your Smart Assistant"
};

// تحميل لغة المتصفح
const browserLanguage = navigator.language.split('-')[0]; // مثل 'ar', 'fr', 'en'
const appLanguage = ['ar', 'fr', 'en'].includes(browserLanguage) ? browserLanguage : 'en';

// تغيير عنوان التطبيق بناءً على اللغة
document.getElementById('app-title').textContent = {
    ar: "برنامج المحادثة",
    fr: "Programme de Chat",
    en: "Chat Program"
}[appLanguage];

// تغيير نصوص الواجهة
document.getElementById('message-input').placeholder = {
    ar: "اكتب رسالتك هنا...",
    fr: "Écrivez votre message ici...",
    en: "Type your message here..."
}[appLanguage];

document.querySelector('button').textContent = {
    ar: "إرسال",
    fr: "Envoyer",
    en: "Send"
}[appLanguage];

// دالة للكشف عن لغة الرسالة
function detectLanguage(message) {
    if (/[\u0600-\u06FF]/.test(message)) return 'ar'; // عربية
    if (/[éèêëàâùûîïôöç]/.test(message.toLowerCase())) return 'fr'; // فرنسية
    if (/[A-Za-z]/.test(message)) return 'en'; // إنجليزية
    return 'en'; // الإنجليزية كافتراضية
}

// دالة للرد على التحية
function getGreetingResponse(language) {
    return {
        ar: `مرحبًا! أنا ${BOT_NAME.ar}. كيف يمكنني مساعدتك اليوم؟`,
        fr: `Bonjour! Je suis ${BOT_NAME.fr}. Comment puis-je vous aider aujourd'hui?`,
        en: `Hello! I am ${BOT_NAME.en}. How can I assist you today?`
    }[language];
}

// دالة للرد على سؤال "ما هو اسمك"
function getBotNameResponse(language) {
    return {
        ar: `اسمي ${BOT_NAME.ar}. كيف يمكنني مساعدتك؟`,
        fr: `Je m'appelle ${BOT_NAME.fr}. Comment puis-je vous aider?`,
        en: `My name is ${BOT_NAME.en}. How can I assist you?`
    }[language];
}

// دالة للبحث على الإنترنت بلغة محددة
async function searchInternet(query, language) {
    try {
        const wikiUrl = {
            ar: 'https://ar.wikipedia.org/w/api.php',
            fr: 'https://fr.wikipedia.org/w/api.php',
            en: 'https://en.wikipedia.org/w/api.php'
        }[language];

        const response = await fetch(`${wikiUrl}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
        const data = await response.json();

        if (data.query && data.query.search) {
            const results = data.query.search.map(result => result.snippet);
            const cleanResults = results.map(result => 
                result.replace(/<[^>]+>/g, '')
                      .replace(/&quot;/g, '"')
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
            );
            return cleanResults.join(' ').slice(0, 450);
        }
    } catch (error) {
        console.error('Error searching:', error);
    }
    return '';
}

// دالة لإنشاء رد بناءً على نتائج البحث
function generateResponse(question, searchResult, language) {
    return {
        ar: `بناءً على ما وجدت، ${searchResult}. هل يمكنني مساعدتك في شيء آخر؟`,
        fr: `D'après ce que j'ai trouvé, ${searchResult}. Puis-je vous aider avec autre chose?`,
        en: `Based on what I found, ${searchResult}. Can I assist you with anything else?`
    }[language];
}

// دالة لإرسال الرسالة
async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (message) {
        appendMessage('user', message);
        await processMessage(message);
        input.value = '';
    }
}

// دالة لمعالجة الرسالة
async function processMessage(message) {
    showProgress();

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        let response;
        const detectedLanguage = detectLanguage(message); // الكشف عن لغة السؤال
        const responseLanguage = detectedLanguage; // الرد بلغة الرسالة نفسها

        // التحقق من التحية
        if (isGreeting(message)) {
            response = getGreetingResponse(responseLanguage); // رد التحية مباشرة
        } 
        // التحقق من السؤال عن الاسم
        else if (isAskingForName(message)) {
            response = getBotNameResponse(responseLanguage); // الرد على السؤال عن الاسم
        } 
        // البحث على الإنترنت للأسئلة الأخرى
        else {
            const keywords = extractKeywords(message);
            const searchResult = await searchInternet(keywords.join(' '), responseLanguage);
            response = generateResponse(message, searchResult, responseLanguage);
        }

        appendMessage('bot', response);
    } catch (error) {
        console.error('Error in processing message:', error);
        appendMessage('bot', {
            ar: 'حدث خطأ أثناء البحث. هل تود تجربة سؤال آخر؟',
            fr: 'Une erreur s\'est produite lors de la recherche. Voulez-vous essayer une autre question?',
            en: 'An error occurred while searching. Would you like to try another question?'
        }[appLanguage]);
    } finally {
        hideProgress();
    }
}


// دالة للتحقق من الضغط على Enter
function checkEnter(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// دالة لإضافة رسالة إلى نافذة المحادثة
function appendMessage(sender, message) {
    const chatWindow = document.getElementById('chat-window');
    const messageElement = document.createElement('div');
    messageElement.className = sender + '-message';
    messageElement.textContent = message;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// دالة لإظهار شريط التقدم
function showProgress() {
    document.getElementById('progress').style.display = 'block';
}

// دالة لإخفاء شريط التقدم
function hideProgress() {
    document.getElementById('progress').style.display = 'none';
}

// دالة للتحقق من وجود تحية
function isGreeting(message) {
    const greetings = {
        ar: ['مرحب', 'سلام', 'صباح الخير', 'مساء الخير', 'أهلاً', 'أهلا', 'هاي', 'هلا', 'كيف الحال', 'شخبارك'],
        fr: ['bonjour', 'salut', 'coucou', 'hello', 'hi'],
        en: ['hello', 'hi', 'hey', 'good morning', 'good evening']
    };

    // التحقق من وجود appLanguage في الكائن greetings
    const greetingList = greetings[appLanguage] || greetings['en']; // استخدام الإنجليزية كافتراضية
    return greetingList.some(greeting => message.toLowerCase().includes(greeting));
}

// دالة للتحقق من السؤال عن الاسم
function isAskingForName(message) {
    const nameKeywords = {
        ar: ['اسمك', 'ما اسمك', 'ما هو اسمك', 'ماهو اسمك', 'عرفني باسمك', 'عرفني عن نفسك'],
        fr: ['ton nom', 'comment tu t\'appelles', 'quel est ton nom', 'dis-moi ton nom'],
        en: ['your name', 'what is your name', 'what\'s your name', 'tell me your name']
    };

    // التحقق من وجود appLanguage في الكائن nameKeywords
    const keywords = nameKeywords[appLanguage] || nameKeywords['en']; // استخدام الإنجليزية كافتراضية
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
}

// دالة لاستخراج الكلمات المفتاحية
function extractKeywords(message) {
    const stopWords = {
        ar: ['هل', 'ما', 'كم', 'رأيك', 'تعتقد', 'هو', 'هي', 'أن', 'عن', 'في', 'على', 'من', 'لل', 'بال', 'و'],
        fr: ['est', 'que', 'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'pour', 'avec', 'sur'],
        en: ['is', 'the', 'a', 'an', 'and', 'or', 'for', 'with', 'on', 'in', 'at']
    };

    // التحقق من وجود appLanguage في الكائن stopWords
    const stopWordsList = stopWords[appLanguage] || stopWords['en']; // استخدام الإنجليزية كافتراضية
    return message.toLowerCase().split(' ').filter(word =>
        word.length > 2 && !stopWordsList.includes(word)
    );
}
