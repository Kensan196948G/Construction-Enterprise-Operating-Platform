# ServerSummary


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**storage** | **str** |  | [optional] [default to 'ok']
**redis** | **str** |  | [optional] [default to 'disabled']
**uptime_seconds** | **float** |  | [optional] [default to 0.0]

## Example

```python
from cdx_client.models.server_summary import ServerSummary

# TODO update the JSON string below
json = "{}"
# create an instance of ServerSummary from a JSON string
server_summary_instance = ServerSummary.from_json(json)
# print the JSON string representation of the object
print(ServerSummary.to_json())

# convert the object into a dict
server_summary_dict = server_summary_instance.to_dict()
# create an instance of ServerSummary from a dict
server_summary_from_dict = ServerSummary.from_dict(server_summary_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


