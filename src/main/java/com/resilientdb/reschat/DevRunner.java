package com.resilientdb.reschat;

import com.resilientdb.reschat.kvservice.ResilientDBConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DevRunner implements ApplicationRunner {
    @Autowired
    private ResilientDBConfig config;

    @Override
    public void run(ApplicationArguments args) throws Exception {
//        Page page = new Page();
//        ZoneId zone = ZoneId.systemDefault();
//        LocalDateTime now = LocalDateTime.now();
//        System.out.println(zone.getId());
//        Message msg = new Message("Kenny", now, zone.getId(), true, "Hi", "aaa", "bbb");
//        page.addMessage(msg);
//        String jsonString = page.toJsonString();
//        System.out.println(jsonString);
//        Page page2 = new Page(jsonString);
//        System.out.println(page2.page.getFirst().getMessage());

    }
}

