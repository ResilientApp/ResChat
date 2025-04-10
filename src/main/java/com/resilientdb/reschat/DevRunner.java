package com.resilientdb.reschat;

import com.resilientdb.reschat.ipfs.IpfsClusterConfig;
import com.resilientdb.reschat.ipfs.IpfsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
public class DevRunner implements ApplicationRunner {

    @Autowired
    private IpfsClusterConfig ipfsClusterConfig;
    @Autowired
    private IpfsService ipfsService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        File file = new File("kenny.txt");
        String cid = ipfsService.uploadFile(file);
        System.out.println(cid);
//        String cid = "QmUAMk3GcGgbUqdZuFUX1veRcwkB5fxxnVox81iem39Kua";
        ipfsService.downloadFile(cid, "kenny2.txt");
    }
}

