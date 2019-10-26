import { HttpClient, HttpRequest, HttpResponse, HttpMethod } from "@paperbits/common/http";
import { CaptchaParams } from "../contracts/captchaParams";
import { SignupRequest } from "../contracts/signupRequest";
import { ResetRequest, ResetPassword, ChangePasswordRequest } from "../contracts/resetRequest";
import { IAuthenticator } from "../authentication";
import { DelegationAction } from "../contracts/tenantSettings";

export class BackendService {
    constructor(
        private readonly httpClient: HttpClient,
        private readonly authenticator: IAuthenticator
    ) { }

    public async getCaptchaParams(): Promise<CaptchaParams> {
        let response: HttpResponse<CaptchaParams>;
        const httpRequest: HttpRequest = {
            method: HttpMethod.get,
            url: this.getUrl("/captcha")
        };

        try {
            response = await this.httpClient.send<any>(httpRequest);
        }
        catch (error) {
            throw new Error(`Unable to complete request. Error: ${error.message}`);
        }

        return this.handleResponse(response);
    }

    public async sendSignupRequest(signupRequest: SignupRequest): Promise<void> {
        const response = await this.httpClient.send(
            {
                url: this.getUrl("/signup"),
                method: HttpMethod.post,
                headers: [{ name: "Content-Type", value: "application/json" }],
                body: JSON.stringify(signupRequest)
            });
        if (response.statusCode !== 200) {
            if (response.statusCode === 400) {
                const responseObj = <any>response.toObject();
                throw responseObj.error;
            } else {
                throw Error(response.toText());
            }
        }
    }

    public async sendResetRequest(resetRequest: ResetRequest): Promise<void> {
        const response = await this.httpClient.send(
            {
                url: this.getUrl("/reset-password-request"),
                method: HttpMethod.post,
                headers: [{ name: "Content-Type", value: "application/json" }],
                body: JSON.stringify(resetRequest)
            });
        if (response.statusCode !== 200) {
            if (response.statusCode === 400) {
                const responseObj = <any>response.toObject();
                throw responseObj.error;
            } else {
                throw Error(response.toText());
            }
        }
    }

    public async sendChangePassword(changePasswordRequest: ChangePasswordRequest): Promise<void> {
        const authToken = this.authenticator.getAccessToken();

        if (!authToken) {
            throw Error("Auth token not found");
        }

        const response = await this.httpClient.send(
            {
                url: this.getUrl("/change-password"),
                method: HttpMethod.post,
                headers: [{ name: "Authorization", value: authToken }, { name: "Content-Type", value: "application/json" }],
                body: JSON.stringify(changePasswordRequest)
            });
        if (response.statusCode !== 200) {
            if (response.statusCode === 400) {
                const responseObj = <any>response.toObject();
                throw responseObj.error;
            } else {
                throw Error(response.toText());
            }
        }
    }

    public async sendConfirmRequest(resetPassword: ResetPassword): Promise<void> {
        const response = await this.httpClient.send(
            {
                url: this.getUrl("/confirm/password"),
                method: HttpMethod.post,
                headers: [{ name: "Content-Type", value: "application/json" }],
                body: JSON.stringify(resetPassword)
            });
        if (response.statusCode !== 200) {
            throw Error(response.toText());
        }
    }

    public async getDelegationUrl(action: DelegationAction, delegationParameters: {}): Promise<string> {
        const authToken = this.authenticator.getAccessToken();

        if (!authToken) {
            throw Error("Auth token not found");
        }

        const payload = {
            delegationAction: action,
            delegationParameters: delegationParameters
        }
        const response = await this.httpClient.send(
            {
                url: this.getUrl("/delegation-url"),
                method: HttpMethod.post,
                headers: [{ name: "Authorization", value: authToken }, { name: "Content-Type", value: "application/json" }],
                body: JSON.stringify(payload)
            });
        if (response.statusCode === 200) {
            const result = response.toObject();
            return result["url"];
        } else {
            throw Error(response.toText());
        }
    }

    private getUrl(path: string): string {
        return path;
    }

    private handleResponse(response: HttpResponse<CaptchaParams>): CaptchaParams {
        if (response.statusCode === 200) {
            return response.toObject();
        }
        else {
            throw new Error("Unable to handle Captcha response. Check captcha endpoint on server.");
        }
    }
}
