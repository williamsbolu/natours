import axios from 'axios'; // we later imported d npm package
import { showAlert } from './alert';

export const login = async (email, password) => {
    // console.log(email, password);
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password,
            },
        });

        // console.log(res);
        if (res.data.status === 'success') {
            showAlert('success', 'Logged in successfully');

            window.setTimeout(() => {
                location.assign('/'); // load the main page
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        });
        // console.log(res);

        if (res.data.status === 'success') location.reload(true); // true forces reload from d server and not from d browser cache
    } catch (err) {
        console.log(err.response);
        showAlert('error', 'Error logging out! try again.');
    }
};
