package com.automate.automate.models;

import android.text.TextUtils;
import android.util.Log;

import com.automate.automate.exceptions.AutomateJsonParsingException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collections;
import java.util.List;

import lombok.Builder;
import lombok.Value;

/**
 * Created by davidfrancoeur on 2015-11-14.
 */
@Value
@Builder
public class ParkingSpot {
    private final static String LOGGER_TAG = ParkingSpot.class.getName();

    private final static String JSON_ID = "id";
    private final static String JSON_LATITUDE = "latitude";
    private final static String JSON_LONGITUDE = "longitude";

    private final String id;
    private final Double latitude;
    private final Double longitude;

    public static ParkingSpot fromPayload(JSONObject reader) throws AutomateJsonParsingException {
        try {
            String id = reader.getString(JSON_ID);
            Double latitude = reader.getDouble(JSON_LATITUDE);
            Double longitude = reader.getDouble(JSON_LONGITUDE);

            return builder()
                    .id(id)
                    .latitude(latitude)
                    .longitude(longitude)
                    .build();

        } catch (JSONException e) {
            throw new AutomateJsonParsingException(reader.toString(), e);
        }
    }

    public static List<ParkingSpot> fromArrayPayload(String jsonArray) throws AutomateJsonParsingException {
        try {
            List<ParkingSpot> result = Collections.emptyList();
            Log.d(LOGGER_TAG, String.format("Parsing: %s", jsonArray));

            if (!TextUtils.isEmpty(jsonArray)) {
                JSONArray array = new JSONArray(jsonArray);
                for (int i = 0; i < array.length(); i++) {
                    result.add(fromPayload(array.getJSONObject(i)));
                }
            }

            return result;

        } catch (JSONException e) {
            throw new AutomateJsonParsingException(jsonArray, e);
        }
    }

}
