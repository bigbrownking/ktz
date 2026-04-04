package org.ktz.ktzsimulator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KtzSimulatorApplication {

	public static void main(String[] args) {
		SpringApplication.run(KtzSimulatorApplication.class, args);
	}

}
