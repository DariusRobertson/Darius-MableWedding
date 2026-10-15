
const lookupForm = document.getElementById("lookupForm");
const guestNameInput = document.getElementById("guestName");
const lookupMessage = document.getElementById("lookupMessage"); 

const STORAGE_KEY = "savedWeddingGuestCode"; 

async function loadGuest(){
    const response = await fetch("../data/friend-data.json");

    if(!response.ok){
        throw new Error("Could not load guest list.");
    }

    return await response.json();
}

function normalizeGuestName(guestName){
    return guestName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function redirectIfRemembered(){
    const guestCode = localStorage.getItem(STORAGE_KEY);
    if(guestCode){
        window.location.href = `wedding.html?name=${encodeURIComponent(guestCode)}`;
    }
}

lookupForm.addEventListener("submit", async function (e) {
    
    e.preventDefault();

    const input = normalizeGuestName(guestNameInput.value);
    if(!input){
        lookupMessage.textContent = "Please enter a name.";
        return;
    }

    lookupMessage.textContent = "searching...";

    try{
        const guests = await loadGuest();
        const mainGuest = guests.invitees.find(g => normalizeGuestName(g.firstName + " " + g.lastName) === input);
        const plus1 = guests.invitees.find(g => normalizeGuestName(g.guestName) === input);

        const matchedGuest = mainGuest || plus1;

        if(matchedGuest){
            localStorage.setItem(STORAGE_KEY, matchedGuest.code);
            window.location.href = `wedding.html?name=${encodeURIComponent(matchedGuest.code)}`;
        }else{
            lookupMessage.textContent = "Name not found, Try your full name or your nickname.";
        }
    } catch(error){
        lookupMessage.textContent = "Error: " + error.message;
    }

    });

redirectIfRemembered();
loadGuest();

