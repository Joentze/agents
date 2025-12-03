import {
  discoverOAuthMetadata,
  type OAuthClientProvider,
  refreshAuthorization,
} from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformation,
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { useMcpStore } from "@/stores/use-mcps";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";

class McpOAuthProvider implements OAuthClientProvider {
  private _tokens?: OAuthTokens;
  private _clientInfo?: OAuthClientInformation;
  private _codeVerifier?: string;

  constructor(private serverUrl: string, private clientName = "My MCP Client") {
    // Restore persisted state from storage
    this.restoreState();
  }

  private restoreState(): void {
    console.log("restoring...", this.clientMetadata, this.clientInformation());

    // Restore tokens from Zustand store

    // Restore client info from sessionStorage
    const storedClientInfo = sessionStorage.getItem(
      `mcp_client_info_${this.serverUrl}`
    );
    if (storedClientInfo) {
      try {
        this._clientInfo = JSON.parse(storedClientInfo);
      } catch {
        // Silently ignore parsing errors
      }
    }

    // Restore code verifier from sessionStorage
    const storedVerifier = sessionStorage.getItem(
      `mcp_code_verifier_${this.serverUrl}`
    );
    if (storedVerifier) {
      this._codeVerifier = storedVerifier;
    }
    const storedTokens = useMcpStore.getState().getTokens(this.serverUrl);
    if (storedTokens) {
      // if (
      //   storedTokens.refresh_token &&
      //   storedTokens.expires_at &&
      //   new Date(storedTokens.expires_at) < new Date()
      // ) {
      //   console.log("refreshing expired tokens");
      //   discoverOAuthMetadata(this.serverUrl).then(async (metadata) => {
      //     console.log(57, metadata);
      //     const tokenEndpoint = metadata?.token_endpoint;
      //     console.log(59, tokenEndpoint);
      //     if (
      //       tokenEndpoint &&
      //       this._clientInfo?.client_id &&
      //       storedTokens.refresh_token
      //     ) {
      //       console.log(65, this._clientInfo.client_id);
      //       console.log(66, storedTokens.refresh_token);
      //       try {
      //         const response = await fetch(tokenEndpoint, {
      //           method: "POST",
      //           headers: {
      //             "Content-Type": "application/x-www-form-urlencoded",
      //           },
      //           body: new URLSearchParams({
      //             grant_type: "refresh_token",
      //             refresh_token: storedTokens.refresh_token,
      //             client_id: this._clientInfo.client_id,
      //           }),
      //         });
      //         console.log(79, response);
      //         if (response.ok) {
      //           console.log(81, response.ok);
      //           const newTokens = (await response.json()) as OAuthTokens;
      //           console.log(83, newTokens);
      //           await this.saveTokens(newTokens);
      //           console.log("tokens refreshed successfully");
      //         } else {
      //           console.error("Failed to refresh tokens:", response.statusText);
      //           this.clearTokens();
      //         }
      //       } catch (error) {
      //         console.error("Error refreshing tokens:", error);
      //         this.clearTokens();
      //       }
      //     }
      //   });
      // }
      this._tokens = storedTokens;
    }
  }

  get redirectUrl(): string {
    return `${window.location.origin}/oauth/callback`;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: this.clientName,
      client_uri: window.location.origin,
      redirect_uris: [this.redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      //   scope: "read write",
      token_endpoint_auth_method: "none",
    };
  }

  clientInformation(): OAuthClientInformation | undefined {
    return this._clientInfo;
  }

  async saveClientInformation(info: OAuthClientInformation): Promise<void> {
    this._clientInfo = info;
    // Persist to sessionStorage
    sessionStorage.setItem(
      `mcp_client_info_${this.serverUrl}`,
      JSON.stringify(info)
    );
  }

  tokens(): OAuthTokens | undefined {
    return this._tokens;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    console.log("saveTokens", tokens);
    this._tokens = tokens;
    const expiresIn = tokens.expires_in;
    if (expiresIn) {
      let now = new Date();
      now.setDate(now.getDate() + expiresIn);
      const expiresAt = now.toISOString();
      useMcpStore
        .getState()
        .setServer(
          this.serverUrl,
          { ...tokens, expires_at: expiresAt },
          this.clientName
        );
    }
    // Save to Zustand store with client name (automatically persisted to localStorage)
    useMcpStore
      .getState()
      .setServer(
        this.serverUrl,
        { ...tokens, expires_at: undefined },
        this.clientName
      );
  }

  async redirectToAuthorization(url: URL): Promise<void> {
    window.location.href = url.toString();
  }

  async saveCodeVerifier(verifier: string): Promise<void> {
    this._codeVerifier = verifier;
    // Persist to sessionStorage
    sessionStorage.setItem(`mcp_code_verifier_${this.serverUrl}`, verifier);
  }

  async codeVerifier(): Promise<string> {
    if (!this._codeVerifier) throw new Error("No code verifier stored");
    return this._codeVerifier;
  }

  // Optional: Clean up stored OAuth state after successful connection
  clearOAuthState(): void {
    // sessionStorage.removeItem(`mcp_client_info_${this.serverUrl}`);
    sessionStorage.removeItem(`mcp_code_verifier_${this.serverUrl}`);
    // Don't clear tokens here - they should persist for reuse
  }

  // Clear tokens from store (for logout or error scenarios)
  clearTokens(): void {
    useMcpStore.getState().clearServer(this.serverUrl);
    this._tokens = undefined;
  }
}

export { McpOAuthProvider };
