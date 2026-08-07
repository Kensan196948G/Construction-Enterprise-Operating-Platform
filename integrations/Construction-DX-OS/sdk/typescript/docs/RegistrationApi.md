# RegistrationApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createRegistrationTokenApiV1DevicesRegistrationTokensPost**](RegistrationApi.md#createregistrationtokenapiv1devicesregistrationtokenspost) | **POST** /api/v1/devices/registration-tokens | Create Registration Token |
| [**rotateDeviceTokenApiV1AuthRotatePost**](RegistrationApi.md#rotatedevicetokenapiv1authrotatepost) | **POST** /api/v1/auth/rotate | Rotate Device Token |



## createRegistrationTokenApiV1DevicesRegistrationTokensPost

> RegistrationTokenResponse createRegistrationTokenApiV1DevicesRegistrationTokensPost(registrationTokenRequest)

Create Registration Token

Issue an ephemeral registration token to a bootstrapping device.  Called by &#x60;&#x60;agent-bootstrap.sh&#x60;&#x60; during PXE provisioning.  The token is single-use (consumed on first &#x60;&#x60;/api/v1/devices/register&#x60;&#x60; call) and expires after 24 hours.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from 'cdx-client';
import type { CreateRegistrationTokenApiV1DevicesRegistrationTokensPostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new RegistrationApi();

  const body = {
    // RegistrationTokenRequest
    registrationTokenRequest: ...,
  } satisfies CreateRegistrationTokenApiV1DevicesRegistrationTokensPostRequest;

  try {
    const data = await api.createRegistrationTokenApiV1DevicesRegistrationTokensPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **registrationTokenRequest** | [RegistrationTokenRequest](RegistrationTokenRequest.md) |  | |

### Return type

[**RegistrationTokenResponse**](RegistrationTokenResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## rotateDeviceTokenApiV1AuthRotatePost

> TokenRotateResponse rotateDeviceTokenApiV1AuthRotatePost(tokenRotateRequest)

Rotate Device Token

Rotate a device\&#39;s long-lived auth token (48-hour TTL).  Gated by HMAC-SHA256 device signature (same scheme as heartbeat/inventory). The agent calls this endpoint automatically before token expiry.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from 'cdx-client';
import type { RotateDeviceTokenApiV1AuthRotatePostRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const api = new RegistrationApi();

  const body = {
    // TokenRotateRequest
    tokenRotateRequest: ...,
  } satisfies RotateDeviceTokenApiV1AuthRotatePostRequest;

  try {
    const data = await api.rotateDeviceTokenApiV1AuthRotatePost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tokenRotateRequest** | [TokenRotateRequest](TokenRotateRequest.md) |  | |

### Return type

[**TokenRotateResponse**](TokenRotateResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

