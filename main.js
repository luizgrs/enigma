class Game {
    
    #secretWord;
    #wordSize = 5;
    #maxGuesses = 6;

    #keyBoard;
    #currentChar;
    #currentGuess;
    #canGuess = false;
    #canEvaluate = false;
    #gameEnd = true;

    get #currentGuessSelector(){
        return this.#guessSelector(this.#currentGuess);
    }

    #guessSelector(guessPos) {
        return `#guesses .guess:nth-child(${guessPos})`;
    }

    get #currentGuessCharDom(){
        return this.#guessCharDom(this.#currentChar);
    }

    #guessCharDom(charPos){
        return $(`${this.#currentGuessSelector} .char:nth-child(${charPos})`);
    }

    constructor(){
        this.#keyBoard = new Keyboard(Keyboard.types.querty, this);
    }

    start(secretWord){
        this.#secretWord = secretWord.toUpperCase();
        this.#wordSize = this.#secretWord.length;
        this.#currentGuess = 0;
        this.#gameEnd = false;
        this.#newGuessTry();
    }

    #newGuessTry(){
        this.#canEvaluate = false;

        if(this.#currentGuess < this.#maxGuesses){
            this.#canGuess = true;
            this.#currentChar = 1;
            this.#currentGuess++;
        }
    }

    guess(char){
        if(this.#canGuess){
            txt(this.#currentGuessCharDom, char.toUpperCase());

            this.#canGuess = this.#currentChar != this.#wordSize;
            if(this.#canGuess)
                this.#currentChar++;
            else
                this.#canEvaluate = true;
        }
    }

    evaluateGuess(){
        if(this.#canEvaluate){
            this.#canEvaluate = false;

            const guessWord = $(this.#currentGuessSelector).innerText.replaceAll(/\W/g, "");
            let correctPositions = 0;

            for(let charPos=0;charPos < guessWord.length;charPos++){
                const guessChar = guessWord[charPos];
                const secretChar = this.#secretWord[charPos];
                const charDomClasses = this.#guessCharDom(charPos+1).classList;

                if(guessChar === secretChar){
                    this.#keyBoard.setSuccessKey(guessChar);
                    correctPositions++
                    charDomClasses.add('success');
                }
                else if(this.#secretWord.indexOf(guessChar) > -1){
                    this.#keyBoard.setAlmostKey(guessChar);
                    charDomClasses.add('almost');
                }
                else{
                    this.#keyBoard.setErrorKey(guessChar);
                    charDomClasses.add('error');
                }
            }

            if(correctPositions === this.#wordSize)
                this.#endGame(true);
            else if(this.#currentGuess === this.#maxGuesses)
                this.#endGame(false);
            else
                this.#newGuessTry();
        }
    }

    backspace(){
        if(this.#currentChar > 1 && !this.#gameEnd){
            if(this.#canGuess)
                this.#currentChar--;
            this.#currentGuessCharDom.innerText = '';
            this.#canEvaluate = false;
            this.#canGuess = true;
        }
    }

    #createResultMessage(){
        let message = "";
        for(let x = 1; x <= this.#currentGuess; x++){
            if(x > 1)
                message += "\r\n";

            $all(`${this.#guessSelector(x)} .char`).forEach(guess => {
                const classList = guess.classList;
                if(classList.contains('success'))
                    message += "🟩";
                else if(classList.contains('almost'))
                    message += "🟨";
                else
                    message += "🟥";
            });
        }
        
        message += "\r\n\r\n";
        message += res("tryToo").replace("{0}", document.location.href);

        return message;
    }

    #shareResult(){
        navigator.share({
            text: this.#createResultMessage()
        });
    }

    #copyResult(){
        navigator.clipboard.writeText(this.#createResultMessage());
    }

    #endGame(win){
        this.#gameEnd = true;
        this.#canGuess = false;

        const dialog = $id('gameEndDialog');
        const message = $('p', dialog);
        if(win)
            txt(message, res("win"));
        else
            txt(message, res("lose").replace("{0}", this.#secretWord));

        const shareButton = $id('shareResultButton');
        txt(shareButton, res('share'));
        shareButton.addEventListener('click', () => this.#shareResult());
        
        const copyButton = $id('copyResultButton');
        txt(copyButton, res('copy'));
        copyButton.addEventListener('click', () => this.#copyResult());

        const createButton = $id('createMineButton');
        txt(createButton, res("createYours"));
        createButton.addEventListener('click', () => document.location = document.location.origin + document.location.pathname);

        dialog.showModal();
    }
}

class Keyboard {
    #dom;    
    #domKeys = {}
    #game;

    constructor(type, ownerGame){
        this.#game = ownerGame;

        this.#dom = $id('keyboard'); 
        this.#dom.addEventListener('click', e => this.#keyboardClick(e));
        this.#dom.innerHTML = '';

        for(const row of type){
            const domRow = el('div');
            this.#dom.appendChild(domRow);
            
            for(const key of row){
                const domKey = el('button');
                domRow.appendChild(domKey);

                switch(key)
                {
                    case "\n":
                        txt(domKey, "ENTER");
                        domKey.classList.add("enter");
                        break;

                    case "\b":
                        txt(domKey, "←");
                        domKey.classList.add("backspace");
                        break;

                    default:
                        const keyChar = key.toUpperCase();
                        txt(domKey, keyChar);
                        this.#domKeys[keyChar] = domKey;
                        break;
                }                
            }
        }
    }

    #keyboardClick(e){
        if(e.target.tagName === 'BUTTON'){
            const button = e.target;
            if(button.classList.contains('enter'))
                this.#game.evaluateGuess();
            else if(button.classList.contains('backspace'))
                this.#game.backspace();
            else
                this.#game.guess(button.innerText);
        }
    }

    #setKeyState(char, state){
        this.#domKeys[char].classList.add(state);
    }

    setSuccessKey(char){
        this.#setKeyState(char, 'success');
    }

    setAlmostKey(char){
        this.#setKeyState(char, 'almost');
    }

    setErrorKey(char){
        this.#setKeyState(char, 'error');
    }

    static types = {
        querty: [
            "qwertyuiop",
            "asdfghjkl",
            "\nzxcvbnm\b"
        ]
    }
}

function $id(id){
    return document.getElementById(id);
}

function $(selector, context){
    return (context || document).querySelector(selector);
}

function $all(selector){
    return document.querySelectorAll(selector);
}


function txt(el, text){
    const txtNode = document.createTextNode(text);
    el.appendChild(txtNode);
}

function el(tag, textOrattrs, attrs){
    const e = document.createElement(tag);
    
    if(typeof textOrattrs !== "string")
        attrs = textOrattrs;
    else
        txt(e, textOrattrs);
    
    for(let attr in attrs)
    {
        const attrValue = attrs[attr];
        switch(attr){
            case 'class':
                e.classList.add(attrValue);
                break;
            default:
                e.setAttribute(attr, attrValue);
                break;
        }
    }

    return e;
}

function createNewGame(){
    $id('newGameForm').addEventListener('submit', e => {
        e.preventDefault();
        createLink();
    });
    txt($id('wordInputLabel'), res('wordInputLabel'));
    txt($id('newGameButton'), res('createGame'));
    $id('newGameDialog').showModal();
}

function createLink(){
    const word = $id('newWord').value.trim();
    if(word){
        if(word.length != 5)
            alert(res("tooShort"));
        else {   
            txt($id('newGameMessage'), res('newGameMessage'));
            const link = document.location.origin + document.location.pathname + '?' + btoa(word);        
            const linkBox = $id('gameLink');
            linkBox.value = link;   
            linkBox.select();
            
            const copyButton = $id('copyLink');
            txt(copyButton, res('copy'));
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(link);
            });

            const shareButton = $id('shareLink');
            txt(shareButton, res(`share`));
            shareButton.addEventListener('click', () => {
                navigator.share({
                    url: link
                });
            });

            $id('newGameDialog').close();
            $id('newGameShareDialog').showModal();
        }
    }
}

let currentResources;
function res(key){ return currentResources[key] || key; }

function defineLanguage(){
    const resources = {
        "pt": {
            "wordInputLabel": "Qual deve ser a palavra secreta?",
            "newGameMessage": "Compartilhe este link para que tentem adivinhá-la",
            "createGame": "Criar",
            "copy": "Copiar",
            "share": "Compartilhar",
            "win": "Você Acertou!",
            "lose": "Você não conseguiu, a palavra era {0}",
            "tryToo": "Tente também em {0}",
            "tooShort": 'A palavra deve ter 5 letras',
            "newGame": "Criar",
            "createYours": "Criar Meu Jogo"
        },
        "en": {
            "wordInputLabel": "What is the secret word?",
            "newGameMessage": "Share this link for other try guess it",
            "createGame": "Create",
            "copy": "Copy",
            "share": "Share",
            "win": "You won!",
            "lose": "You failed, the word was {0}",
            "tryToo": "Try too {0}",
            "tooShort": 'Word must be 5 characters long',
            "newGame": "New",
            "createYours": "Create Mine"
        }
    };

    var language = navigator.language.toLowerCase();
    while(!currentResources && language){
        currentResources = resources[language];

        if(!currentResources)
            language = language.substr(0, language.lastIndexOf("-"))
    }

    if(!currentResources)
        currentResources = resources["en"];
}

function init(){
    defineLanguage();

    txt($id('newLink'), res('newGame'));

    let word;
    if(document.location.search)
        word = atob(document.location.search.substr(1));

    if(!word)
        createNewGame();
    else
        new Game().start(word);
}

function onload(fn){
    window.addEventListener('load', fn);
}

onload(init);

