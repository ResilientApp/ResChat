package com.resilientdb.reschat;

import com.resilientdb.reschat.ipfs.IpfsClusterConfig;
import com.resilientdb.reschat.ipfs.IpfsService;
import com.resilientdb.reschat.kvservice.ResilientDBConfig;
import com.resilientdb.reschat.message.Message;
import com.resilientdb.reschat.page.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.LocalDateTime;
import java.time.ZoneId;

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

