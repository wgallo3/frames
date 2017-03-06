import { safeClient } from "./util";

//load the current longNames into the list
async function loadNames(): Promise<void> {
    const dropdown : HTMLSelectElement = <HTMLSelectElement> document.getElementById("longNames");

    const length : number = dropdown.length;

    for (let i = 0; i < length; i++) {
        dropdown.remove(0);
    }

    await safeClient.dns.getLongNames().then((data) => {
        data.forEach((name) => { dropdown.add(new Option(name, name)); });
    });
}

async function addLongName(): Promise<void> {
    const inputField : HTMLInputElement = <HTMLInputElement> document.getElementById("longName");
    const name: string = inputField.value;
    if (name) {
        await safeClient.dns.register(name).then(() => {
            const errorMsg : HTMLElement = <HTMLElement> document.getElementById("error_msg");
            errorMsg.innerHTML = "";
        }, (err) => {
            const errorMsg : HTMLElement = <HTMLElement> document.getElementById("error_msg");
            errorMsg.innerHTML = err;
        });
        await loadNames();
        inputField.value = '';
    }
};

//connect this function to the button on the page
const addButton: HTMLButtonElement = <HTMLButtonElement> document.getElementById("addLongName");
addButton.addEventListener('click', addLongName, false);

loadNames();