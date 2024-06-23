import http from 'k6/http';
import {sleep} from 'k6';
import {check} from 'k6';
import {Gauge} from 'k6/metrics';
import {Counter} from 'k6/metrics';
import {prompts} from './prompts.js';

const promptTokens = new Gauge('prompt_tokens');
const totalTokens = new Gauge('total_tokens');
const completionTokens = new Gauge('completion_tokens');

const timeout = '10m';
export const options = {
    // A number specifying the number of VUs to run concurrently.
    vus: 1,
    // A number specifying the number of iterations to run for each VU.
    iterations: 1,
    // A string specifying the total duration of the test run.
    duration: timeout,
};

function ollama(targetPrompt) {
    const payload = JSON.stringify({
        model: 'llama3',
        prompt: targetPrompt,
        stream: false,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: timeout,
    };

    const r = http.post(`http://${__ENV.TARGET_HOSTNAME}/api/generate`, payload, params);
    check(r, {
        'is status 200': (r) => r.status === 200,
        'has response': (r) => {
            const body = JSON.parse(r.body);
            const hasResponse = body && body.response && body.response.length > 0;
            if (hasResponse) {
                console.log(body.response.length);
            } else if (body.error) {
                console.log(body.error);
            }
            return hasResponse;
        }
    });
}

function openai(targetPrompt) {
    const payload = JSON.stringify({
        model: 'facebook/opt-125m',
        prompt: targetPrompt,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: timeout,
    };

    const r = http.post(`http://${__ENV.TARGET_HOSTNAME}/v1/completions`, payload, params);
    check(r, {
        'is status 200': (r) => r.status === 200,
        'has choices': (r) => {
            const body = JSON.parse(r.body);
            const hasChoices = body && body.choices && body.choices.length > 0;
            if (hasChoices) {
                console.log(body.choices[0].text);
                promptTokens.add(body.usage.prompt_tokens);
                totalTokens.add(body.usage.total_tokens);
                completionTokens.add(body.usage.completion_tokens);
            } else if (body.object === 'error') {
                console.log(body.message);
            }
            return hasChoices;
        }
    });
}

export default function () {
    const targetPrompt = prompts[parseInt(__ENV.TARGET_PROMPT_INDEX) || 0];
    switch (__ENV.TARGET_API_TYPE) {
        case 'ollama':
            ollama(targetPrompt);
            break;
        case 'openai':
            openai(targetPrompt);
            break;
        default:
            console.log('Unknown TARGET_API_TYPE. Must be one of "ollama" or "openai"');
    }
    sleep(1);
}
