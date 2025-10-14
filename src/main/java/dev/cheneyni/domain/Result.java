package dev.cheneyni.domain;

import java.util.ArrayList;
import java.util.List;

public class Result<T> {

    private final ArrayList<String> messages = new ArrayList<>();
    private ResultType type = ResultType.SUCCESS;
    private T data;

    public boolean isSuccess() {
        return type == ResultType.SUCCESS;
    }

    public List<String> getMessages() {
        return messages;
    }

    public void addMessage(String message, ResultType type) {
        messages.add(message);
        this.type = type;
    }

    public ResultType getType() {
        return type;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
