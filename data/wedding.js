

const guestDisplayName = document.getElementById("guestDisplayName");
const plusOne = document.getElementById("plusOne");
const guestCount = document.getElementById("guestCount");
const customMessage = document.getElementById("customMessage");
const plusOneMealWrap = document.getElementById("plusOneMealWrap");
const plusOneMealName = document.getElementById("plusOneMealName");
const guestMealName = document.getElementById("guestMealName");
const numberOfGuestWrap = document.getElementById("numberOfGuest");
const rsvpForm = document.getElementById("rsvpForm");
const declinedInvite = document.getElementById("decline").addEventListener("click", updatedAttendance);
const acceptedInvite = document.getElementById("accept").addEventListener("click", updatedAttendance);
const numberOfGuest = document.getElementById("guestCount").addEventListener("input", updatedAttendance);


const rsvpFormButton = document.getElementById("rsvpFormButton");

let guest = null; 

if (rsvpFormButton) {
    rsvpFormButton.addEventListener("click", async function (e) {
        e.preventDefault();
        const guest = await loadInvite();
        sendRSVP(guest);
    });
}


const STORAGE_KEY = "savedWeddingGuestCode"; 
const google_sheet_script_url = "https://script.google.com/macros/s/AKfycbz6MrQ473JGAp8umbV9FLF3EiGmhi-p7er3MWLm4RGJsnM3pBDPjFd31_eesL2KH7EY/exec";
const google_search_name_url = "https://script.google.com/macros/s/AKfycbzMgNgbdavFlIhQfcOaBIapve1dL_v-Jtb8wxCx4thPIs-gnfxX--u-4oPfZ7HcjhRK/exec";


async function loadGuest(){
    const response = await fetch("../data/friend-data.json");

    if(!response.ok){
        throw new Error("Could not load guest list.");
    }

    return await response.json();
}

async function searchGuestByName(name){
  const url = google_search_name_url + "?name=" + encodeURIComponent(name);
  console.log("Search URL:", url);

  const response = await fetch(url);
  return await response.json();

}

function updatedAttendance(){
    if(document.getElementById("decline").checked){

        rsvpForm.classList.add("hidden");
        document.getElementsByName("mainCourseGuest2")[0].required = false;    
        document.getElementsByName("mainCourseGuest2")[1].required = false;
        document.getElementsByName("mainCourseGuest1")[0].required = false;    
        document.getElementsByName("mainCourseGuest1")[1].required = false;
        return false; 
    }

    if(document.getElementById("accept").checked){
        rsvpForm.classList.remove("hidden");
        
        document.getElementsByName("mainCourseGuest2")[0].required = true;    
        document.getElementsByName("mainCourseGuest2")[1].required = true;
        document.getElementsByName("mainCourseGuest1")[0].required = true;    
        document.getElementsByName("mainCourseGuest1")[1].required = true;
        checkGuestCount();

        return true; 
        
    }

    checkGuestCount();  

 }

 function checkGuestCount(){

    const numberOfGuest = parseInt(document.getElementById("guestCount").value);
    console.log(numberOfGuest);

    if(numberOfGuest === 1){
        document.getElementsByName("mainCourseGuest2")[0].required = false;    
        document.getElementsByName("mainCourseGuest2")[1].required = false;
        plusOneMealWrap.classList.add("hidden");
    }else{
        document.getElementsByName("mainCourseGuest2")[0].required = true;    
        document.getElementsByName("mainCourseGuest2")[1].required = true;
        plusOneMealWrap.classList.remove("hidden");
    }

 }

 function checkRequiredIsFilled(guest){
  const guestCount = document.getElementById("guestCount").value;
  const guestMeal1 = document.querySelector('input[name="mainCourseGuest1"]:checked')?.value || "";
  const guestMeal2 = document.querySelector('input[name="mainCourseGuest2"]:checked')?.value || ""; 

  const needsGuest2Meal = guest["plus-1"] && Number(guestCount) === 2;
  const guestDeclined = document.getElementById("decline").checked;

  if(guestDeclined){
    return true; 
  }

  console.log("guestMeal2: ", needsGuest2Meal);

  const requiredFields = [
    guestCount !== "",
    guestMeal1 !== "",
    !needsGuest2Meal || guestMeal2 !== "",
  ]; 

  console.log(requiredFields);
  return requiredFields.every(Boolean);
 
 }


 async function checkIfAlreadyRSVP(guest){
  const nameToSearch = guest.firstName + " " + guest.lastName;
  const guestSearch = await searchGuestByName(nameToSearch);

  
  console.log("Searching name:", nameToSearch);
  console.log("Search result:", guestSearch);

  if(guestSearch.found){
    console.log(guestSearch); 
    return false; 
  }
    return true; 
 }

async function sendRSVP(guest) {
  console.log("guest param: ", guest)
  if(!(await checkIfAlreadyRSVP(guest))){
    rsvpMessage.textContent = "You have already RSVP'd.";
  }else if(!checkRequiredIsFilled(guest)){
    rsvpMessage.textContent = "Please fill out all required fields.";
  }else{
    try {
      const attendance = document.querySelector('input[name="attendance"]:checked')?.value || "";
      const guestMeal1 = document.querySelector('input[name="mainCourseGuest1"]:checked')?.value || "";
      const guestMeal2 = document.querySelector('input[name="mainCourseGuest2"]:checked')?.value || "";
      const guestAttending = document.querySelector('input[name="guestCount"]:checked')?.value || "";

      const guestCountInput = document.getElementById("guestCount");
      const dietaryNotes = document.getElementById("dietaryNotes");
      
      const plusOneName = guest["plus-1"] ? guest.guestName : "None";

      let guestCount; 
      if (attendance === "decline") {
        guestCount = 0; 
      }else{
        guestCount = guestCountInput && guestCountInput.value ? Number(guestCountInput.value) : 1;
      }

      const payload = {
        guestCode: guest.code || "",
        guestName: `${guest.firstName || ""} ${guest.lastName || ""}`.trim(),
        attendance: attendance,
        guestCount: guestCount,
        plusOneName: plusOneName,
        guestMeal1: guestMeal1,
        guestMeal2: guestMeal2,
        dietaryNotes: dietaryNotes ? dietaryNotes.value.trim() : "None"
      };

      const form = document.createElement("form");
      form.method = "POST";
      form.action = google_sheet_script_url;
      form.target = "hidden_iframe";
      form.style.display = "none";

      Object.entries(payload).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      let iframe = document.getElementById("hidden_iframe");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.name = "hidden_iframe";
        iframe.id = "hidden_iframe";
        iframe.style.display = "none";
        document.body.appendChild(iframe);
      }

      document.body.appendChild(form);
      form.submit();

      if (rsvpMessage) {
        rsvpMessage.textContent = "Your RSVP has been submitted!";
      }

      form.remove();
    } catch (error) {
      console.error(error);
      if (rsvpMessage) {
        rsvpMessage.textContent = "There was a problem submitting your RSVP.";
      }
    }
  }
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
        plusOneMealName.textContent = guest.guestName;
        guestMealName.textContent = guest.firstName;

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


    if (guest["plus-1"]){
        plusOneMealWrap.classList.remove("hidden");
        numberOfGuestWrap.classList.remove("hidden");
    }else{
        plusOneMealWrap.classList.add("hidden");
        numberOfGuestWrap.classList.add("hidden");
        document.getElementsByName("mainCourseGuest2")[0].required = false;    
        document.getElementsByName("mainCourseGuest2")[1].required = false;    
        document.getElementById("guestCount").required = false;
     
    }

    return guest; 

    }catch(error){
        console.error(error);
        document.body.innerHTML = "<h1>Could not load invite.</h1>";
    }
}


loadInvite();
loadGuest();
updatedAttendance();