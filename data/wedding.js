

const guestDisplayName = document.getElementById("guestDisplayName");
const plusOne = document.getElementById("plusOne");
const guestCount = document.getElementById("guestCount");
const customMessage = document.getElementById("customMessage");

const STORAGE_KEY = "savedWeddingGuestCode"; 


async function loadGuest(){
    const response = await fetch("../data/friend-data.json");

    if(!response.ok){
        throw new Error("Could not load guest list.");
    }

    return await response.json();
}

async function loadInvite(){
    const params = new URLSearchParams(window.location.search);
    let guestCode = params.get("name");

    if (!guestCode){
        guestCode = localStorage.getItem(STORAGE_KEY);
    }

    if(!guestCode){
        window.location.href = "invitation.html";  
        return;
    }

    try{
        const guests = await loadGuest();
        const guest = guests.invitees.find(g => g.code.toLowerCase() === guestCode.toLocaleLowerCase());


        if(!guest){
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = "invitation.html";
            return;
        }

        localStorage.setItem(STORAGE_KEY, guest.code);

        guestDisplayName.textContent = guest.firstName; 
        plusOne.textContent = guest["plus-1"] ? " & " + guest.guestName : "";
        customMessage.textContent = 
            guest.customMessage || "We are so excited for you to join us for our wedding!";

    }catch(error){
        console.error(error);
        document.body.innerHTML = "<h1>Could not load invite.</h1>";
    }
}

loadInvite();