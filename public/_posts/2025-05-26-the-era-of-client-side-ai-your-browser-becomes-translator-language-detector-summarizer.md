---
layout: post
title: "클라이언트 AI의 시대 당신의 브라우저가 번역, 언어 감지, 요약 전문가로 변신합니다."
date: "2025-05-26"
author: Seobisback
tags: [Web,Frontend,AI,ML,Google,2025 Google IO,Translator, Language Detector, Summarizer, Google IO, Chrome, Browser, Client, Client Side AI]
description: "Google I/O 2025 핵심 API 살펴보기"
categories: Survey
---
# Google I/O 2025 핵심 API 살펴보기

- Translator API
- Language Detector API
- Summarizer API

> Google I/O 2025가 이번 5월에 개최되었고, 웹 개발 분야에서 가장 주목할 만한 변화 중 하나는 바로 브라우저 내장 AI의 발전이었습니다.
> 특히 Chrome 138 버전부터 정식으로 도입될 예정인 Client Side의 AI API는 웹 개발의 새로운 시대를 열었다고 해도 과언이 아닙니다.

이 글에서는 'Google I/O 2025' 에서 소개된 핵심적인 API 중 `Translator API`, `Language Detector API`, `Summarizer API` 를 **클라이언트 AI의 시대 당신의 브라우저가 번역, 언어 감지, 요약 전문가로 변신합니다.** 라는 주제로 이야기를 풀고, 프리뷰 형태로 사용하며 구현한 내용을 정리해보려고 합니다.

---

## 목차

1. [클라이언트 AI란 무엇인가?](#section1)
2. [Google I/O 2025에서 발표된 주요 내장 AI API](#section2)
3. [Gemini Nano: 브라우저의 두뇌](#section3)
4. [클라이언트 내장 AI 모델의 장점](#section4)

---

<h2 id="section1">클라이언트 AI란 무엇인가?</h2>

클라이언트 AI는 서버가 아닌 사용자의 기기(브라우저)에서 직접 AI 모델을 실행하는 접근 방식입니다. 과거에는 AI 기능을 사용하려면 사용자의 데이터를 서버로 전송하고 처리된 결과를 받아야 했지만, 이제는 브라우저 자체에서 이러한 작업을 수행할 수 있게 되었습니다.

Google은 Chrome 브라우저에 Gemini Nano라는 경량 AI 모델을 탑재하여 다양한 AI 기능을 브라우저에서 직접 사용할 수 있도록 했습니다. 이는 프라이버시 보호, 오프라인 작동, 낮은 지연 시간 등 여러 장점을 제공합니다.

---

<h2 id="section2">Google I/O 2025에서 발표된 주요 내장 AI API</h2>

Google I/O 2025에서는 Chrome 138 버전부터 정식으로 제공되는 다양한 AI API가 발표되었습니다.
특히 주목할 만한 세 가지 API를 살펴보겠습니다.

우선 해당 API를 사용하기 위한 요구사항을 먼저 알아보고 시작할까요?

### API 사용 공통 요구 사항

Chrome의 **Translator API**, **Language Detector API**는 `<u>`Chrome의 Desktop 버전에서만 동작 `</u>`하며,
**Summarizer API**와 이 글에서는 소개하지 않지만 함께 소개된 **Prompt API**, **Writer API**, **Rewriter API**는 아래와 같이 좀 더 제한적인 상황에서 동작합니다.

> 하드웨어 요구사항 검토 출처 (https://developer.chrome.com/docs/ai/summarizer-api?hl=ko#hardware-requirements)
>
> - 운영체제: Windows 10 또는 11, macOS 13 이상 (Ventura 이상), Linux, Android, iOS, ChromeOS용 Chrome은 아직 Gemini Nano를 지원하는 API에서 지원되지 않습니다.
> - 저장용량: Chrome 프로필이 포함된 볼륨에 22GB 이상 여유 공간이 있어야 합니다.
> - GPU: VRAM이 4GB 이상이어야 합니다.
> - 네트워크: 무제한 데이터 또는 무제한 연결

상당히 많은 저장 용량을 요구하는 부분이 있지만, 공식 문서에서는 하나의 모델의 크기가 22GB가 아닌 충분한 저장 용량 확보를 위해 22GB로 소개하고 있습니다.
저장 용량이 10GB 미만으로 내려가면 모델이 기기에서 삭제되며, 저장 용량의 여유가 확보되면 다시 로드한다고 소개하고 있으니 저장 공간 활용에도 상당히 고민한 것으로 보입니다.

이 요구 사항이 모두 충족된 상황에서 Translator API 부터 소개하겠습니다.

### Translator API (번역 API)

> [Translator API Docs](https://developer.chrome.com/docs/ai/translator-api)

Translator API는 웹 페이지나 사용자 콘텐츠를 다양한 언어로 즉시 번역할 수 있는 기능을 제공합니다.
이전에는 Google 번역기 서비스를 사용하기 위해 서버 요청이 필요했지만, 이제는 브라우저에 내장된 모델로 직접 번역이 가능하게 됩니다.

우선 사용하기 이전에 Chrome 버전이 123 이상인지 확인해주세요.
그리고 브라우저에서 해당 기능을 활성화 하기 위해 주소창에 `chrome://flags/#translation-api` 을 입력하여,
접속 후 `Experimental translation API` 플래그를 활성화하면 Early Preview 사용 준비가 끝났습니다.

![Experimental translation API 활성화](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/01.png)
(Experimental translation API 활성화)

앞서 링크한 [API Docs](https://developer.chrome.com/docs/ai/translator-api)와 [Translator Github](https://github.com/WICG/translation-api)를 보면서 구현을 진행해보겠습니다.

#### 구현

우선 브라우저가 Translator API를 지원하는지 코드 상으로 확인하는 작업이 필요합니다.

```javascript
let isTranslatorSupported = false;

if('Translator' in self) {
    statusText.textContent = 'Translator API를 지원하는 브라우저입니다.';
    isTranslatorSupported = true;
} else {
    statusText.textContent = 'Translator API를 지원하지 않는 브라우저입니다.';
    statusText.classList.add('error');
    translateButton.disabled = true;
    // Translator API가 지원되지 않는 경우
    statusElement.textContent = 'Translator API가 지원되지 않습니다. Chrome 123 이상 버전이 필요합니다.';
    translateBtn.disabled = true;
  
    // 추가 안내 메시지
    const infoElement = document.createElement('div');
    infoElement.innerHTML = `
        <p style="color: red;">Chrome의 Translator API를 사용하려면:</p>
        <ol>
            <li>Chrome 123 이상 버전을 사용하세요.</li>
            <li>chrome://flags/#translation-api 플래그를 활성화하세요.</li>
            <li>필요한 경우 chrome://flags/#language-detection-api 플래그도 활성화하세요.</li>
            <li>브라우저를 재시작하세요.</li>
        </ol>
    `;
    document.querySelector('.translation-box').appendChild(infoElement);
    return;
}
```

저는 다음과 같이 공식 문서에 소개된 내용대로 브라우저가 해당 API를 지원하는지 여부 확인하고 해당 내용을  `flag` 형태로 관리 후 구현을 진행하겠습니다.

번역을 진행하는 이벤트 트리거는 버튼을 클릭할 경우 진행하기 위해 `EventListener` 를 만들어줍니다.

```javascript
const translateButton = document.querySelector('#translateButton');

translateButton.addEventListener('click', async () => {
    /**
     * 앞서 체크한 flag를 통해 브라우저가 API를 지원하지 않는 경우 Early Return 합니다.
     */
    if(!isTranslatorSupported) {
        return;
    }
  
    try {
        /**
         * 유저에게 입력받거나 드롭 박스 UI 등을 통해서 입력받은 값을 가지고 번역 가능 여부를 확인합니다.
         */
        const sourceLang = sourceLanguage.value;
        const targetLang = targetLanguage.value;

        const translatorCapabilities = await Translator.availability({
            sourceLanguage: sourceLang, 
            targetLanguage: targetLang,
        });

        if(translatorCapabilities === 'unsupported') {
            statusText.textContent = '해당 언어의 쌍은 현재 번역을 지원하지 않습니다.';
            statusText.classList.add('error');
            return;
        }

        if (translatorCapabilities === 'downloadable' || translatorCapabilities === 'downloading') {
            statusText.textContent = '번역 모델 다운로드 중... 잠시 기다려주세요.';
        }

        /**
         * Translator 를 생성 후 번역을 진행하며, monitor를 넘겨 모델이 다운로드 되고 있음을 유저에게 보여줍니다.
         */
        const translator = await Translator.create({
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            monitor(m) {
                m.addEventListener('progress', (event) => {
                    statusText.textContent = `모델 다운로드 중... ${Math.round(event.progress * 100)}%`;
                })
                m.addEventListener('error', (event) => {
                    statusText.textContent = '모델 다운로드 실패';
                    statusText.classList.add('error');
                })
            }
        });

        /**
         * 번역을 진행 후 완료된 Text 형태의 output을 UI상에 업데이트하면 한 cycle의 번역이 종료됩니다.
         */
        const result = await translator.translate(textToTranslate);
        translatedTextArea.value = result;
    } catch (error) {
        // 에러 처리
        // ...
    }
})
```

제가 간단하게 만든 Demo를 확인해볼까요?

![Translator API Demo App](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/02.png)
(Translator API Demo App)

아직까지 Preview 형태로 사용할 수 있는 만큼 일부 언어 쌍은 지원되지 않을 수 있습니다.
그리고 첫 번역 시에는 모델 다운로드가 필수적이므로 네트워크 환경에 따라서 지연이 발생할 수 있습니다.

![Translator API Demo App GIF](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/03.gif)
(Translator API Demo App GIF)

> Github Repository: [@sdf5771/2025-google-io/translator-api](https://github.com/sdf5771/2025-google-io/tree/main/translator-api)

### Language Detector API (언어 감지 API)

> [Language Detector API Docs](https://developer.chrome.com/docs/ai/language-detection)

다음으로는 Language Detector API를 알아보겠습니다.

Language Detector API는 텍스트의 언어를 자동으로 식별하는 기능을 제공합니다.
이는 다국어 콘텐츠를 다루는 웹사이트에서 특히 유용하게 사용될 것으로 보입니다.

우선 사용하기 이전에 Chrome 버전이 123 이상인지 확인한 후,
브라우저에서 해당 기능을 활성화 하기 위해 주소창에 `chrome://flags/#language-detection-api` 을 입력하여,
접속 후 `Language detection web platform API` 플래그를 활성화하면 Early Preview 사용 준비가 끝났습니다.

![Language detection web platform API 활성화](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/04.png)
(Language detection web platform API 활성화)

동일하게 [API Docs](https://developer.chrome.com/docs/ai/language-detection)와 [Language Detector Github](https://github.com/webmachinelearning/translation-api?tab=readme-ov-file#language-detection)를 보면서 구현을 진행해보겠습니다.

Language Detector API는 output으로 감지된 언어와 신뢰도(confidence)를 주는데요.

구현한 데모 앱을 통해 함께 확인해보시죠.

#### 구현

우선 앞서 구현한 Translator API와 마찬가지로 브라우저가 Language Detector API를 지원하는지 코드 상으로 확인하는 작업을 먼저 진행하겠습니다.

```javascript
let isLanguageDetectorSupported = false;

if('LanguageDetector' in self){
    statusText.textContent = 'Language Detector API를 지원하는 브라우저입니다.';
    isLanguageDetectorSupported = true;
} else {
    statusText.textContent = 'Language Detector API를 지원하지 않는 브라우저입니다.';
    statusText.classList.add('error');
    detectButton.disabled = true;

    const infoElement = document.createElement('div');
    infoElement.innerHTML = `
        <p style="color: red;">Chrome의 Language Detector API를 사용하려면:</p>
        <ol>
            <li>Chrome 123 이상 버전을 사용하세요.</li>
            <li>chrome://flags/#language-detection-api 플래그를 활성화하세요.</li>
            <li>브라우저를 재시작하세요.</li>
        </ol>
    `;
    document.querySelector('.container').appendChild(infoElement);
    return;
}
```

동일하게 공식 문서에 소개된 내용대로 브라우저가 해당 API를 지원하는지 여부 확인 후  `flag` 로 관리하면서 구현을 진행합니다.

또한 언어 식별을 진행하는 이벤트 트리거는 버튼을 클릭할 경우로 진행하기 위해 마찬가지로 버튼의 `EventListener` 를 만들어줍니다.

```javascript
const detectButton = document.querySelector('#detectButton');

detectButton.addEventListener('click', async () => {
    /**
     * 앞서 체크한 flag를 통해 브라우저가 API를 지원하지 않는 경우 Early Return 합니다.
     */
    if(!isLanguageDetectorSupported){
        return;
    }

    const text = textInput.value.trim();

    if(text === ''){
        statusText.textContent = '텍스트를 입력해주세요.';
        statusText.classList.add('error');
        return;
    }

    try {
        /**
         * 언어 식별 가능 여부를 확인합니다.
         */
        const availability = await LanguageDetector.availability();
        let detector;
        if(availability === 'unsupported'){
            statusText.textContent = 'Language Detector API를 지원하지 않는 브라우저입니다.';
            statusText.classList.add('error');
            return;
        }

        if(availability === 'downloadable' || availability === 'downloading'){
            statusText.textContent = 'Language Detector API 모델 다운로드 중... 잠시 기다려주세요.';
        }

        /**
         * Language Detector 를 생성 후 식별을 진행하며, monitor를 넘겨 모델이 다운로드 되고 있음을 유저에게 보여줍니다.
         */
        detector = await LanguageDetector.create({
            monitor(m){
                m.addEventListener('downloadprogress', (event) => {
                    statusText.textContent = `모델 다운로드 중... ${event.loaded * 100}%`;
                })
            }
        });

        /**
         * 식별을 진행 후 완료된 {confidence: number, detectedLanguage: string}[] 형태의 output을 UI상에 업데이트하면 한 cycle의 언어 식별이 종료됩니다.
         */
        const results = await detector.detect(text);

        let detectedLanguages = '';

        for (const result of results){
            detectedLanguages += `Detected Language: ${result.detectedLanguage} (confidence: ${result.confidence})\n`;
        }

        outputText.value = detectedLanguages;
        statusText.textContent = '언어 감지 완료';
        statusText.classList.add('success');
    } catch (error) {
        console.error('Language Detection Error:', error);
        statusText.textContent = '언어 감지 실패';
        statusText.classList.add('error');
        outputText.value = `오류: ${error.message || '알 수 없는 오류가 발생했습니다.'}`;
    }
});
```

다음은 Language Detector API의 예시 output 데이터 입니다.

```json
[
    {
        "confidence": 0.9980044364929199,
        "detectedLanguage": "ko"
    },
    {
        "confidence": 0.0004322653403505683,
        "detectedLanguage": "und"
    }
]
```

`detectedLanguage` 가 식별된 언어이며, 해당 식별된 언어가 맞는지의 신뢰도를 `confidence` 에 포함합니다.

UI가 포함된 간단하게 만든 Demo를 확인해보겠습니다.

![Language Detector API Demo App](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/05.png)
(Language Detector API Demo App)

![Language Detector API Demo App GIF](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/06.gif)
(Language Detector API Demo App GIF)

> Github Repository: [@sdf5771/2025-google-io/language-detector-api](https://github.com/sdf5771/2025-google-io/tree/main/language-detector-api)

### Summarizer API (요약 API)

> [Summarizer API Docs](https://developer.chrome.com/docs/ai/summarizer-api)

마지막으로 긴 기사, 복잡한 문서 등 간결한 요약이 필요한 텍스트를 요약할 수 있는 기능을 제공하는 Summarizer API에 대해 알아보겠습니다.

Summarizer API는 앞서 설명한 내용과 같이 긴 텍스트를 핵심 내용만 추출하여 간결하게 요약해주는 기능을 제공합니다.
이는 뉴스 기사, 블로그 포스트, 연구 논문 등 긴 콘텐츠를 핵심 내용만 빠르게 파악해야 할 때 유용할 것으로 보입니다.

동일하게 Chrome 버전이 123 이상인지 확인하셨다면,
브라우저에서 해당 기능을 활성화 하기 위해 주소창에 `chrome://flags/#summarization-api-for-gemini-nano` 을 입력하여,
접속 후 `Summarization API for Gemini Nano` 플래그를 활성화하면 Early Preview 사용 준비가 끝났습니다.

![Summarization API for Gemini Nano 활성화](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/07.png)
(Summarization API for Gemini Nano 활성화)

[Summarizer API Docs](https://developer.chrome.com/docs/ai/summarizer-api)와 [Language Detector Github](https://github.com/webmachinelearning/writing-assistance-apis?tab=readme-ov-file#basic-usage)를 보면서 바로 구현을 진행해보겠습니다.

#### 구현

마찬가지로 브라우저가 Summarizer API를 지원하는지 코드 상으로 확인하는 작업을 먼저 진행합니다.

```javascript
let isSummarizerSupported = false;

if('Summarizer' in self){
    statusText.textContent = 'Summarizer API를 지원하는 브라우저입니다.';
    isSummarizerSupported = true;
} else {
    statusText.textContent = 'Summarizer API를 지원하지 않는 브라우저입니다.';
    statusText.classList.add('error');
    summarizeButton.disabled = true;

    const infoElement = document.createElement('div');
    infoElement.innerHTML = `
        <p style="color: red;">Chrome의 Summarizer API를 사용하려면:</p>
        <ol>
            <li>Chrome 123 이상 버전을 사용하세요.</li>
            <li>chrome://flags/#summarization-api-for-gemini-nano 플래그를 활성화하세요.</li>
            <li>브라우저를 재시작하세요.</li>
        </ol>
    `;
    statusText.appendChild(infoElement);
}
```

Summarizer API 는 `summarize` 메서드와 `summarizeStreaming` 메서드가 있습니다만
`summarize` 메서드는 일괄적으로 요약을 진행하며,
`summarizeStreaming ` 메서드를 사용하면 입력이 추가되고 조정되면 출력이 계속 업데이트 되는 기능을 구현할 수 있다고 합니다.

이번 데모 애플리케이션은 `summarize` 메서드를 사용한 구현을 진행하겠습니다.

위에서 소개한 데모들과 마찬가지로 브라우저가 해당 API를 지원하는지 여부 확인 후  `flag` 로 관리하면서 구현을 진행합니다.

또한 일괄 요약을 진행하는 이벤트 트리거는 버튼을 클릭할 경우로 진행하기 위해 버튼의 `EventListener` 를 만들어줍니다.

```javascript
const summarizeButton = document.querySelector('#summarizeButton');

summarizeButton.addEventListener('click', async () => {
    /**
     * 앞서 체크한 flag를 통해 브라우저가 API를 지원하지 않는 경우 Early Return 합니다.
     */
    if(!isSummarizerSupported){
        return;
    }

    const text = textInput.value;

    if(!text){
        statusText.textContent = '요약할 텍스트를 입력하세요.';
        statusText.classList.add('error');
        return;
    }

    try {
        /**
         * 요약 가능 여부를 확인합니다.
         */
        const availability = await Summarizer.availability();
        let summarizer;

        if(availability === 'unavailable'){
            statusText.textContent = 'Summarizer API를 사용할 수 없습니다.';
            statusText.classList.add('error');
            return;
        }

        summarizeButton.disabled = true;
        summarizeButton.textContent = '요약 중...';

        /**
         * Summarizer 를 생성 후 요약에 관한 option 값을 넘겨 요약을 진행하며, 동일하게 monitor를 넘겨 모델이 다운로드 되고 있음을 유저에게 보여줍니다.
         */
        summarizer = await Summarizer.create({
            type: 'key-points',
            format: 'markdown',
            length: 'medium',
            monitor: (m) => {
                m.addEventListener('downloadprogress', (event) => {
                    statusText.textContent = `요약 모델 다운로드 중... ${event.loaded * 100}%`;
                });
            }
        });

        summarizeButton.disabled = false;
        summarizeButton.textContent = 'Summarize';

        /**
         * 일괄 요약 진행 후 완료된 text 형태의 output을 UI상에 업데이트하면 한 cycle의 일괄 요약이 종료됩니다.
         */
        const summary = await summarizer.summarize(text);
        outputText.value = summary;
        statusText.textContent = '요약이 완료되었습니다.';
        statusText.classList.add('success');
  
    } catch (error) {
        console.error('error ', error);
        statusText.textContent = '요약 중 오류가 발생했습니다.';
        statusText.classList.add('error');
    }
})
```

구현된 Demo를 확인해보겠습니다.

![Summarizer API Demo App](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/08.png)
(Summarizer API Demo App)

![Summarizer API Demo App GIF](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/09.gif)
(Summarizer API Demo App GIF)

> Github Repository: [@sdf5771/2025-google-io/summarizer-api](https://github.com/sdf5771/2025-google-io/tree/main/summarizer-api)

---

<h2 id="section3">Gemini Nano: 브라우저의 두뇌</h2>

![Gemini Nano](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/10.jpg)
(Gemini Nano)

위에서 소개한 API들은 모두 Google의 `Gemini Nano` 모델을 기반으로 동작합니다.

Gemini Nano는 Google이 개발한 경량 AI 모델이며, 모바일 기기나 브라우저에서 직접 실행할 수 있도록 최적화되었습니다.

Gemini Nano의 특징은 다음과 같습니다.

1. **경량화**: 많은 저장 공간을 필요로 하거나, 실행에 많은 하드웨어 리소스를 요구하는 다른 대형 모델과는 달리 Nano는 브라우저에서 효율적으로 실행할 수 있도록 최적화되었습니다.
2. **하드웨어 가속**: Chrome의 WebNN(Web Neural Network) API를 통해 사용자 기기의 GPU나 NPU(Neural Processing Unit)를 활용하여 AI 모델을 가속화합니다.
3. **멀티모달 지원**: 텍스트 input 뿐만 아니라 이미지, 오디오까지 처리할 수 있는 멀티모달 기능을 제공합니다. 해당 부분은 [Prompt API](https://developer.chrome.com/docs/ai/prompt-api?hl=ko)에서 사용할 수 있으며, 해당 API는 이 글의 작성일 기준으로 Chrome의 Canary에서만 실험적으로 지원하고 있습니다.

이런 특징을 가진 Gemini Nano는 훌륭하지만 완벽하지만은 않습니다.
컴퓨팅 자원을 활용하는 것에선는 `트레이드 오프(Trade-off)` 라는 단어가 있습니다.

> 트레이드 오프(Trade-off): 다른 측면에서 이득을 얻으면서 집합 또는 디자인의 품질, 양, 속성을 없애거나 잃어버리는 일이 수반되는 상황적 결정

Gemini Nano 또한 경량화를 위한 트레이드 오프가 존재하며,
널리 알고 있는 `GPT-4`나 `Claude 3.7 Sonnet`, Google의 패밀리 모델인 `Gemini 2.5 Pro` 와 같은 대형 모델에 비해 복잡한 추론이나 창작 능력에서는 한계가 있을 수 밖에 없습니다.

또한 경량화를 진행하였음에도 구형 기기나 저사양 기기에서는 원활한 실행이 어려울 수 있으며,
브라우저에 내장된 만큼 기존 서버 기반의 모델들처럼 실시간으로 업데이트되지 않아 모델 기능 개선에도 적지 않은 제약이 있을 것으로 보입니다.

그렇다면 Google은 왜 이러한 단점도 포함된 경량화한 AI 모델을 사용하며, 클라이언트 측에서 사용하려는 것 일까요?

바로 **서버 기반 AI가 가진 근본적인 문제를 해결**하기 위함입니다.

### 서버 기반 AI의 문제

기존 서버 기반 AI 서비스들은 다음과 같은 문제점을 가지고 있습니다.

- 프라이버시: 사용자의 모든 데이터는 서버로 전송되어 처리되기 때문에 프라이버시에 관한 이슈가 존재합니다.
- 네트워크 의존성: 인터넷 환경이 불안정하거나 끊어지면 사용이 불가한 이슈가 존재합니다.
- 높은 지연 시간: 네트워크를 통해 서버와 데이터 교환을 진행하다보니 서버와 클라이언트의 네트워크 상황에 따라 지연 시간이 문제가 됩니다.
- 비용 부담: 서버 기반의 AI 서비스는 항상 좋은 성능을 위해 보통 대형 모델을 사용하며, 사용자가 많이 사용하면 할수록 컴퓨팅 자원과 네트워크 비용에서 많은 서버 인프라 비용이 고스란히 부담됩니다.
- 서비스 중단 위험: 서버 기반의 서비스인 만큼 서버에 장애가 발생할 경우 전체 서비스가 마비되는 상황이 일어날 수 있습니다.

이러한 문제점을 해결하기 위해 Google은 성능상의 일부 제약을 감수해서라도 경량화된 모델로도 충분한 퍼포먼스를 낼 수 있는 AI 기능에 클라이언트 사이드(Client Side)에서 AI 모델 사용을 선택한 것이라 생각합니다.

---

<h2 id="section4">클라이언트 내장 AI의 장점</h2>

앞서 언급한 서버 기반 AI의 문제점을 해결하는 방안인 AI 모델을 클라이언트에게,
즉 사용자의 기기에서 동작시키는 것의 장점에 대해 알아보도록 하겠습니다.

클라이언트에 내장된 AI는 대표적으로 삼성의 Galaxy 기기에 탑재된 `Gemini Nano`, Apple이 iPhone, iPad, Macbook 등의 기기에 탑재한 `Apple Intelligence` 등이 있습니다.

![삼성 갤럭시 S24 시리즈에 탑재된 구글 AI](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/11.webp)
(삼성 갤럭시 S24 시리즈에 탑재된 구글 AI)

![Apple - Apple Intelligence](/images/posts/2025-05-26-the-era-of-client-side-ai-your-browser-becomes-translator-language-detector-summarizer/12.webp)
(Apple - Apple Intelligence)

- 프라이버시 강화: 사용자의 데이터가 서버로 전송되지 않으며, 사용자의 기기 내에서 처리되므로 개인정보 보호 측면에서도 큰 장점이 있습니다.
- 오프라인 작동: 인터넷 연결 없이도 AI 모델을 통해 사용자의 요구사항을 처리할 수 있으므로, 기존 서버 기반 AI의 문제에서 언급된 네트워크 의존성이 해결됩니다.
- 낮은 지연 시간: 인터넷 연결이 필요없는 만큼 네트워크를 통한 서버와 클라이언트의 핑퐁(pingpong)이 없어져 지연 시간이 줄어듭니다.
- 서비스 제공자의 비용 절감: 기존 서버 기반 AI처럼 서버의 컴퓨팅 자원과 네트워크 리소스를 사용하지 않기 때문에 대규모 사용자가 이용하는 서비스에서 인프라 비용을 획기적으로 줄일 수 있습니다.
- 확장성과 안정성: 마치 대학교 수강신청과 같이 사용자의 수가 갑자기 급증하여도 서버의 부하가 늘어나지 않으며, 서버 장애로 인한 서비스 중단 위험이 없습니다.

다음과 같은 이점을 통해 일부 성능 제약에도 불구하고, 클라이언트에 AI 모델을 내장하여 사용하는 것에 대한 선택이 늘어나는 것 같습니다.

---

## 끝을 맺으며

Google I/O 2025에서 발표된 AI API는 웹 개발의 새로운 시대를 열었습니다.

세션 내용중에는 Web뿐만 아닌 여러 세션이 많으니 관심이 있으신 분들은 한 번쯤 꼭 확인해보시면 좋을 것 같습니다.

예전에 글로 정리한 내용 중에 Google이 Android XR을 개발중이며 공간형 컴퓨팅 시대에 관해 언급하는 글을 정리한 적이 있는데

해당 내용에 관해서도 Google I/O 2025에 세션이 있으니 참고하시면 좋을 것 같습니다.

이번에 소개된 내용처럼 클라이언트 측에 AI가 내장되고 서버 없이도 유저의 요구사항을 클라이언트에서 처리할 수 있게 계속 확장된다면

프라이버시 강화, 오프라인 작동, 낮은 지연 시간, 비용 절감 등의 장점은 앞으로 더 개발될 AI 서비스에서 개발 방식에 여러 옵션을 더 할 수 있을 것이며,

이는 개발자와 사용자 모두에게 큰 이점을 제공한다고 생각합니다.

앞으로 펼쳐질 새로운 컴퓨팅 시대를 기대하며, 이 글을 마무리하고자 합니다.

긴 글 읽어주셔서 감사합니다.

---

## 참고 자료 출처

- [Google I/O 2025 - What&#39;s new in web keynote](https://io.google/2025/explore/pa-keynote-14)
- [Chrome Built-in AI Early Preview Program Discussions](https://groups.google.com/a/chromium.org/g/chrome-ai-dev-preview-discuss)
- [Chrome for developers - Translator API](https://developer.chrome.com/docs/ai/translator-api?hl=ko)
- [Chrome for developers - Language Detector API](https://developer.chrome.com/docs/ai/language-detection?hl=ko)
- [Chrome for developers - Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api?hl=ko)
- [Gihub webmachinelearning - translation-api](https://github.com/webmachinelearning/translation-api)
- [Gihub webmachinelearning - writing-assistance-apis](https://github.com/webmachinelearning/writing-assistance-apis)
