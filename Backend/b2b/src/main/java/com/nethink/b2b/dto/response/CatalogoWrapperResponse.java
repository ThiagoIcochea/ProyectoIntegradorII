package com.nethink.b2b.dto.response;

public class CatalogoWrapperResponse {

    private CatalogoRecordResponse record;

    public CatalogoWrapperResponse() {
    }

    public CatalogoRecordResponse getRecord() {
        return record;
    }

    public void setRecord(CatalogoRecordResponse record) {
        this.record = record;
    }
}