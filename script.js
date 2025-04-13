async function searchWord() {
    const word = document.getElementById("wordInput").value.trim();
    const resultDiv = document.getElementById("result");
  
    if (!word) {
      resultDiv.innerHTML = "<p>Please enter a word.</p>";
      return;
    }
  
    resultDiv.innerHTML = "<p>Loading...</p>";
  
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();
  
      if (data.title) {
        resultDiv.innerHTML = `<p><strong>${word}</strong> not found!</p>`;
        return;
      }
  
      const wordData = data[0];
      const phonetics = wordData.phonetics.find(p => p.audio) || {};
      const audioUrl = phonetics.audio || '';
      const pronunciation = phonetics.text || '';
  
      let allDefinitionsHTML = "";
      let allSynonyms = new Set();
  
      wordData.meanings.forEach((meaning) => {
        const partOfSpeech = meaning.partOfSpeech;
        meaning.definitions.forEach((definition) => {
          allDefinitionsHTML += `
            <div style="margin-bottom: 10px;">
              <p><strong>Meaning (${partOfSpeech}):</strong> ${definition.definition}</p>
              ${definition.example ? `<p><strong>Example:</strong> <em>"${definition.example}"</em></p>` : ""}
              <p><button onclick="saveToFlashcards('${wordData.word}', '${definition.definition.replace(/'/g, "\\'")}', '${partOfSpeech}')">💾 Save to Flashcards</button></p>
            </div>
          `;
          if (definition.synonyms) {
            definition.synonyms.forEach(s => allSynonyms.add(s));
          }
        });
      });
  
      resultDiv.innerHTML = `
        <h2>${wordData.word}</h2>
        <p><strong>Pronunciation:</strong> ${pronunciation || 'N/A'}</p>
        ${audioUrl ? `<div class="audio-button" onclick="playAudio('${audioUrl}')">🔊 Play Pronunciation</div>` : ''}
        ${allDefinitionsHTML}
        <p><strong>Synonyms:</strong> ${[...allSynonyms].slice(0, 10).join(", ") || "No synonyms found."}</p>
      `;
    } catch (error) {
      resultDiv.innerHTML = `<p>Something went wrong. Try again later.</p>`;
      console.error(error);
    }
  }
  
  function playAudio(url) {
    const audio = new Audio(url);
    audio.play();
  }
  
  // 🔄 Flashcards
  let flashcards = JSON.parse(localStorage.getItem("flashcards") || "[]");
  let currentCardIndex = 0;
  
  function saveToFlashcards(word, definition, partOfSpeech) {
    flashcards.push({ word, definition, partOfSpeech });
    localStorage.setItem("flashcards", JSON.stringify(flashcards));
    alert(`"${word}" saved to flashcards!`);
  }
  
  function switchTab(tab) {
    document.getElementById("searchTab").style.display = tab === 'search' ? 'block' : 'none';
    document.getElementById("flashcardsTab").style.display = tab === 'flashcards' ? 'block' : 'none';
  
    if (tab === 'flashcards') {
      currentCardIndex = 0;
      showFlashcard();
    }
  }
  
  function showFlashcard() {
    const card = flashcards[currentCardIndex];
    const view = document.getElementById("flashcardView");
  
    if (!card) {
      view.innerHTML = "<p>No flashcards saved yet.</p>";
      return;
    }
  
    view.innerHTML = `
      <h3>${card.word}</h3>
      <p><em>${card.partOfSpeech}</em></p>
      <p>${card.definition}</p>
    `;
  }
  
  function nextFlashcard() {
    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    showFlashcard();
  }
  
  // 🎤 Voice Search
  function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
  
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  
    recognition.start();
  
    recognition.onresult = function(event) {
      const spokenWord = event.results[0][0].transcript;
      document.getElementById("wordInput").value = spokenWord;
      searchWord();
    };
  
    recognition.onerror = function(event) {
      alert("Voice search failed. Please try again.");
      console.error(event.error);
    };
  }
  