package com.eartho.one.request.internal;

import com.eartho.one.result.UserIdentity;
import com.eartho.one.result.User;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

class UserProfileDeserializer implements JsonDeserializer<User> {
    @Override
    public User deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        if (!json.isJsonObject() || json.isJsonNull() || json.getAsJsonObject().entrySet().isEmpty()) {
            throw new JsonParseException("user profile json is not a valid json object");
        }

        JsonObject object = json.getAsJsonObject();
        final String uid = context.deserialize(object.remove("uid"), String.class);
        final String displayName = context.deserialize(object.remove("displayName"), String.class);
        final String photoURL = context.deserialize(object.remove("photoURL"), String.class);

        final String email = context.deserialize(object.remove("email"), String.class);
        final String givenName = context.deserialize(object.remove("firstName"), String.class);
        final String familyName = context.deserialize(object.remove("lastName"), String.class);
        final Boolean emailVerified = object.has("emailVerified") ? context.<Boolean>deserialize(object.remove("email_verified"), Boolean.class) : false;
        final String providerSource = context.deserialize(object.remove("providerSource"), String.class);
//        final Date createdAt = context.deserialize(object.remove("createdAt"), Date.class);

        final Type metadataType = new TypeToken<Map<String, Object>>() {
        }.getType();
        Map<String, Object> extraInfo = context.deserialize(object, metadataType);
        return new User(uid,
                displayName,
                photoURL,
                email,
                emailVerified,
                givenName,
                familyName,
                providerSource,
                extraInfo);
    }
}
