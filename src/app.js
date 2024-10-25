const toAddressElement = document.getElementById('toAddress');
const originalAddressElement = document.getElementById('originalAddress');
const balanceElement = document.getElementById('balance');
const sendBtn = document.getElementById('sendBtn');
const submitTransactionBtn = document.getElementById('submitTransactionBtn');

const config = {
    ADDRESS: "YourFilecoinAddress",
    ADDRESS_API_URL: "https://api.node.glif.io",
    API_URL: "FilWalletServerApiUrl:Port",
};

const initConfig = () => {
    originalAddressElement.textContent = config.ADDRESS;
    toAddressElement.textContent = formatAddress(config.ADDRESS);
};

const clearInputs = () => {
    document.getElementById("toInput").value = "";
    document.getElementById("amountInput").value = "";
};

const formatAddress = (address) => {
    return address.slice(0, 16) + '...' + address.slice(-16);
};

const getBalance = async () => {
    try {
        const address = config.ADDRESS;
        const apiBaseUrl = config.ADDRESS_API_URL;
        const response = await fetch(`${apiBaseUrl}/rpc/v0`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "method": "Filecoin.WalletBalance",
                "params": [address],
                "id": 1
            }),
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        const balanceInFil = data.result / Math.pow(10, 18); 
        return balanceInFil.toFixed(4);
    } catch (error) {
        throw new Error('Failed to fetch balance: ' + error.message);
    }
};

const fetchAndUpdateBalance = async () => {    
    const balance = await getBalance(config.ADDRESS, config.ADDRESS_API_URL);
    balanceElement.textContent = balance.toString();
};

const checkSync = async (apiPassword) => {
    try {
        const apiBaseUrl = config.API_URL;
        const response = await fetch(`${apiBaseUrl}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: apiPassword }),
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('Sync failed:', error.message);
        return false;
    }
};


const sendTransaction = async (toAddress, amount, apiPassword) => {
    try {
        const apiBaseUrl = config.API_URL;
        const response = await fetch(`${apiBaseUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: apiPassword,
                toAddress: toAddress,
                amount: amount
            }),
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
        
        
    } catch (error) {
        throw new Error('Transaction failed: ' + error.message);
    }
};

const validateAmount = (amount, balance) => {
    return amount > 0 && amount <= balance;
};

submitTransactionBtn.addEventListener('click', async () => {
    const toAddress = document.getElementById('toInput').value;
    const amount = parseFloat(document.getElementById('amountInput').value);
    const password = document.getElementById('passwordInput').value;
    const balance = parseFloat(balanceElement.textContent);

    if (!validateAmount(amount, balance)) {
        alert('Invalid amount. Please enter a valid amount less than or equal to your balance.');
        return;
    }

    try {
        const syncStatus = await checkSync(password);
        if (!syncStatus) {
            alert('Synchronization failed. Please try again later.');
            return; 
        }

        await sendTransaction(toAddress, amount, password);
        alert('Transaction successful!');
        clearInputs();
        await fetchAndUpdateBalance();
    } catch (error) {
        alert(error.message);
    }
});


sendBtn.addEventListener('click', () => {
    const sendForm = document.getElementById('sendForm');
    sendForm.style.display = 'block';
});

document.getElementById('copyBtn').addEventListener('click', () => {
    const copyBtn = document.getElementById('copyBtn');
    const originalAddress = originalAddressElement.textContent;
    const copiedMessage = document.getElementById('copiedMessage');

    navigator.clipboard.writeText(originalAddress).then(() => {
        copyBtn.style.display = 'none'; 
        copiedMessage.style.display = 'inline';

        setTimeout(() => {
            copiedMessage.style.display = 'none';
            copyBtn.style.display = 'inline';
        }, 1500);
    }).catch(err => {
        alert('Failed to copy address: ' + err);
    });
});

document.getElementById("closeFormBtn").addEventListener("click", () => {
    document.getElementById("sendForm").style.display = "none";
    clearInputs();
});

window.onload = async () => {
    initConfig();
    await fetchAndUpdateBalance();
};
