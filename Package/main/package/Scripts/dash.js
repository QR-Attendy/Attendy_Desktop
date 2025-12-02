document.getElementById("logoutBtn").addEventListener("click", async () => {
    await window.attendyAPI.logout();
});

(async () => {
    const user = await window.attendyAPI.getSession();
    if (!user) location.reload(); // fallback

    // Display user full name, username, and email
    // email part will come soon if we have a server to connect email and send some kind of verification
    //if ther is no email display it as Unknown
    // the fact that its almost optional for users to have an email unless working on a company/School to save attendance records and retrieve on the cloud on their personal server
    document.querySelector('#fullname').innerText = user.fullname;
    document.querySelector('#username').innerText = user.username;
    document.querySelector('#email').innerText = user.email || "Unknown";
    document.querySelector('#fullname2').innerText = user.fullname;
    document.querySelector('#username2').innerText = user.username;
    document.querySelector('#email2').innerText = user.email || "Unknown";

    document.getElementById('welcome').innerText = user.fullname;

    const qr = await window.attendyAPI.generateQR(user);
    document.getElementById("qr-image").src =  `data:image/png;base64,${qr.qr_base64}`;
})();

//This part is for the user to open up their profile with the QR Code and info
document.querySelector("#theUser").addEventListener("click", openInfo);
document.querySelector('#close-USER').addEventListener("click", closeInfo);
async function openInfo() {
    const userCheck = document.querySelector('#theUser-hover');
    // the button yes
    userCheck.classList.add('on-click');
}
async function closeInfo() {
    const userCheck = document.querySelector('#theUser-hover');
    // the button yes
    userCheck.classList.remove('on-click');
}

