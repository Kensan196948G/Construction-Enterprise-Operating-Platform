# cdx-client@0.1.0

A TypeScript SDK client for the localhost API.

## Usage

First, install the SDK from npm.

```bash
npm install cdx-client --save
```

Next, try it out.


```ts
import {
  Configuration,
  AdminApi,
} from 'cdx-client';
import type { DeviceDetailAdminDevicesDeviceIdGetRequest } from 'cdx-client';

async function example() {
  console.log("🚀 Testing cdx-client SDK...");
  const config = new Configuration({ 
    // To configure HTTP basic authorization: HTTPBasic
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    deviceId: deviceId_example,
  } satisfies DeviceDetailAdminDevicesDeviceIdGetRequest;

  try {
    const data = await api.deviceDetailAdminDevicesDeviceIdGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```


## Documentation

### API Endpoints

All URIs are relative to *http://localhost*

| Class | Method | HTTP request | Description
| ----- | ------ | ------------ | -------------
*AdminApi* | [**deviceDetailAdminDevicesDeviceIdGet**](docs/AdminApi.md#devicedetailadmindevicesdeviceidget) | **GET** /admin/devices/{device_id} | Device Detail
*AdminApi* | [**deviceListAdminGet**](docs/AdminApi.md#devicelistadminget) | **GET** /admin | Device List
*AdminApi* | [**isoBuilderCancelAdminIsoBuilderJobIdCancelPost**](docs/AdminApi.md#isobuildercanceladminisobuilderjobidcancelpost) | **POST** /admin/iso-builder/{job_id}/cancel | Iso Builder Cancel
*AdminApi* | [**isoBuilderDetailAdminIsoBuilderJobIdGet**](docs/AdminApi.md#isobuilderdetailadminisobuilderjobidget) | **GET** /admin/iso-builder/{job_id} | Iso Builder Detail
*AdminApi* | [**isoBuilderListAdminIsoBuilderGet**](docs/AdminApi.md#isobuilderlistadminisobuilderget) | **GET** /admin/iso-builder | Iso Builder List
*AdminApi* | [**isoBuilderNewFormAdminIsoBuilderNewGet**](docs/AdminApi.md#isobuildernewformadminisobuildernewget) | **GET** /admin/iso-builder/new | Iso Builder New Form
*AdminApi* | [**isoBuilderSubmitAdminIsoBuilderPost**](docs/AdminApi.md#isobuildersubmitadminisobuilderpost) | **POST** /admin/iso-builder | Iso Builder Submit
*AdminApi* | [**pxeRollbackPageAdminPxeRollbackGet**](docs/AdminApi.md#pxerollbackpageadminpxerollbackget) | **GET** /admin/pxe-rollback | Pxe Rollback Page
*DashboardApi* | [**dashboardApiV1DashboardGet**](docs/DashboardApi.md#dashboardapiv1dashboardget) | **GET** /api/v1/dashboard | Dashboard
*DevicesApi* | [**registerDeviceApiV1DevicesRegisterPost**](docs/DevicesApi.md#registerdeviceapiv1devicesregisterpost) | **POST** /api/v1/devices/register | Register Device
*HealthApi* | [**healthHealthGet**](docs/HealthApi.md#healthhealthget) | **GET** /health | Health
*HealthApi* | [**healthLiveHealthLiveGet**](docs/HealthApi.md#healthlivehealthliveget) | **GET** /health/live | Health Live
*HealthApi* | [**healthReadyHealthReadyGet**](docs/HealthApi.md#healthreadyhealthreadyget) | **GET** /health/ready | Health Ready
*HeartbeatApi* | [**ingestHeartbeatApiV1HeartbeatPost**](docs/HeartbeatApi.md#ingestheartbeatapiv1heartbeatpost) | **POST** /api/v1/heartbeat | Ingest Heartbeat
*InventoryApi* | [**ingestInventoryApiV1InventoryPost**](docs/InventoryApi.md#ingestinventoryapiv1inventorypost) | **POST** /api/v1/inventory | Ingest Inventory
*IsoBuildsApi* | [**cancelIsoBuildJobApiV1IsoBuildsJobIdCancelPost**](docs/IsoBuildsApi.md#cancelisobuildjobapiv1isobuildsjobidcancelpost) | **POST** /api/v1/iso-builds/{job_id}/cancel | Cancel Iso Build Job
*IsoBuildsApi* | [**createIsoBuildJobApiV1IsoBuildsPost**](docs/IsoBuildsApi.md#createisobuildjobapiv1isobuildspost) | **POST** /api/v1/iso-builds | Create Iso Build Job
*IsoBuildsApi* | [**downloadIsoRedirectApiV1IsoBuildsJobIdDownloadGet**](docs/IsoBuildsApi.md#downloadisoredirectapiv1isobuildsjobiddownloadget) | **GET** /api/v1/iso-builds/{job_id}/download | Download Iso Redirect
*IsoBuildsApi* | [**getIsoBuildJobApiV1IsoBuildsJobIdGet**](docs/IsoBuildsApi.md#getisobuildjobapiv1isobuildsjobidget) | **GET** /api/v1/iso-builds/{job_id} | Get Iso Build Job
*IsoBuildsApi* | [**isoBuilderCancelAdminIsoBuilderJobIdCancelPost**](docs/IsoBuildsApi.md#isobuildercanceladminisobuilderjobidcancelpost) | **POST** /admin/iso-builder/{job_id}/cancel | Iso Builder Cancel
*IsoBuildsApi* | [**isoBuilderDetailAdminIsoBuilderJobIdGet**](docs/IsoBuildsApi.md#isobuilderdetailadminisobuilderjobidget) | **GET** /admin/iso-builder/{job_id} | Iso Builder Detail
*IsoBuildsApi* | [**isoBuilderListAdminIsoBuilderGet**](docs/IsoBuildsApi.md#isobuilderlistadminisobuilderget) | **GET** /admin/iso-builder | Iso Builder List
*IsoBuildsApi* | [**isoBuilderNewFormAdminIsoBuilderNewGet**](docs/IsoBuildsApi.md#isobuildernewformadminisobuildernewget) | **GET** /admin/iso-builder/new | Iso Builder New Form
*IsoBuildsApi* | [**isoBuilderSubmitAdminIsoBuilderPost**](docs/IsoBuildsApi.md#isobuildersubmitadminisobuilderpost) | **POST** /admin/iso-builder | Iso Builder Submit
*IsoBuildsApi* | [**listIsoBuildJobsApiV1IsoBuildsGet**](docs/IsoBuildsApi.md#listisobuildjobsapiv1isobuildsget) | **GET** /api/v1/iso-builds | List Iso Build Jobs
*IsoBuildsApi* | [**streamIsoBuildLogApiV1IsoBuildsJobIdLogGet**](docs/IsoBuildsApi.md#streamisobuildlogapiv1isobuildsjobidlogget) | **GET** /api/v1/iso-builds/{job_id}/log | Stream Iso Build Log
*PolicyApi* | [**getPolicyApiV1PolicyGet**](docs/PolicyApi.md#getpolicyapiv1policyget) | **GET** /api/v1/policy | Get Policy
*PxeApi* | [**recordPxeEventApiV1PxeEventsPost**](docs/PxeApi.md#recordpxeeventapiv1pxeeventspost) | **POST** /api/v1/pxe/events | Record Pxe Event
*PxeApi* | [**requestPxeRollbackApiV1PxeRollbackPost**](docs/PxeApi.md#requestpxerollbackapiv1pxerollbackpost) | **POST** /api/v1/pxe/rollback | Request Pxe Rollback
*RegistrationApi* | [**createRegistrationTokenApiV1DevicesRegistrationTokensPost**](docs/RegistrationApi.md#createregistrationtokenapiv1devicesregistrationtokenspost) | **POST** /api/v1/devices/registration-tokens | Create Registration Token
*RegistrationApi* | [**rotateDeviceTokenApiV1AuthRotatePost**](docs/RegistrationApi.md#rotatedevicetokenapiv1authrotatepost) | **POST** /api/v1/auth/rotate | Rotate Device Token
*SerialScanApi* | [**confirmItemApiV1SerialConfirmItemIdPost**](docs/SerialScanApi.md#confirmitemapiv1serialconfirmitemidpost) | **POST** /api/v1/serial/confirm/{item_id} | Confirm Item
*SerialScanApi* | [**discardItemApiV1SerialQueueItemIdDelete**](docs/SerialScanApi.md#discarditemapiv1serialqueueitemiddelete) | **DELETE** /api/v1/serial/queue/{item_id} | Discard Item
*SerialScanApi* | [**getQueueApiV1SerialQueueGet**](docs/SerialScanApi.md#getqueueapiv1serialqueueget) | **GET** /api/v1/serial/queue | Get Queue
*SerialScanApi* | [**serialStatusApiV1SerialStatusGet**](docs/SerialScanApi.md#serialstatusapiv1serialstatusget) | **GET** /api/v1/serial/status | Serial Status
*SerialScanApi* | [**triggerScanApiV1SerialScanPost**](docs/SerialScanApi.md#triggerscanapiv1serialscanpost) | **POST** /api/v1/serial/scan | Trigger Scan


### Models

- [ConfirmRequest](docs/ConfirmRequest.md)
- [DashboardResponse](docs/DashboardResponse.md)
- [DeviceSummary](docs/DeviceSummary.md)
- [HTTPValidationError](docs/HTTPValidationError.md)
- [HealthResponse](docs/HealthResponse.md)
- [HeartbeatResponse](docs/HeartbeatResponse.md)
- [InventoryResponse](docs/InventoryResponse.md)
- [IsoBuildJobCreateRequest](docs/IsoBuildJobCreateRequest.md)
- [IsoBuildJobListResponse](docs/IsoBuildJobListResponse.md)
- [IsoBuildJobResponse](docs/IsoBuildJobResponse.md)
- [IsoBuildSummary](docs/IsoBuildSummary.md)
- [LivenessResponse](docs/LivenessResponse.md)
- [LocationInner](docs/LocationInner.md)
- [PXEBootEvent](docs/PXEBootEvent.md)
- [PXEEventRequest](docs/PXEEventRequest.md)
- [PXEEventResponse](docs/PXEEventResponse.md)
- [PXERollbackPattern](docs/PXERollbackPattern.md)
- [PXERollbackRequest](docs/PXERollbackRequest.md)
- [PXERollbackResponse](docs/PXERollbackResponse.md)
- [PolicyResponse](docs/PolicyResponse.md)
- [RegisterRequest](docs/RegisterRequest.md)
- [RegisterResponse](docs/RegisterResponse.md)
- [RegistrationTokenRequest](docs/RegistrationTokenRequest.md)
- [RegistrationTokenResponse](docs/RegistrationTokenResponse.md)
- [ServerSummary](docs/ServerSummary.md)
- [TokenRotateRequest](docs/TokenRotateRequest.md)
- [TokenRotateResponse](docs/TokenRotateResponse.md)
- [ValidationError](docs/ValidationError.md)

### Authorization


Authentication schemes defined for the API:
<a id="HTTPBasic"></a>
#### HTTPBasic


- **Type**: HTTP basic authentication

## About

This TypeScript SDK client supports the [Fetch API](https://fetch.spec.whatwg.org/)
and is automatically generated by the
[OpenAPI Generator](https://openapi-generator.tech) project:

- API version: `0.1.0`
- Package version: `0.1.0`
- Generator version: `7.21.0`
- Build package: `org.openapitools.codegen.languages.TypeScriptFetchClientCodegen`

The generated npm module supports the following:

- Environments
  * Node.js
  * Webpack
  * Browserify
- Language levels
  * ES5 - you must have a Promises/A+ library installed
  * ES6
- Module systems
  * CommonJS
  * ES6 module system


## Development

### Building

To build the TypeScript source code, you need to have Node.js and npm installed.
After cloning the repository, navigate to the project directory and run:

```bash
npm install
npm run build
```

### Publishing

Once you've built the package, you can publish it to npm:

```bash
npm publish
```

## License

[]()
