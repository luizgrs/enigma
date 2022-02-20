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

    get #guessSelector(){
        return `#guesses .guess:nth-child(${this.#currentGuess})`;
    }

    get #currentGuessCharDom(){
        return this.#guessCharDom(this.#currentChar);
    }

    #guessCharDom(charPos){
        return $(`${this.#guessSelector} .char:nth-child(${charPos})`);
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
        else{ 
            this.#gameEnd = true;
            this.#canGuess = false;
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
            const guessWord = $(this.#guessSelector).innerText.replaceAll(/\W/g, "");
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

function $(selector){
    return document.querySelector(selector);
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
    $id('newGameButton').addEventListener('click', createLink);
    $id('newGameDialog').showModal();
}

function createLink(){
    const word = $id('newWord').value.trim();
    if(word){
        const link = document.location.origin + document.location.pathname + '?' + btoa(word);        
        $id('gameLink').value = link;   
        $id('copyLink').addEventListener('click', () => {
            navigator.clipboard.writeText(link);
        });
        $id('shareLink').addEventListener('click', () => {
            navigator.share({
                url: link
            });
        });

        $id('newGameDialog').close();
        $id('newGameShareDialog').showModal();
    }
}

function init(){
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