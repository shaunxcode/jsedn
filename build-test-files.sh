printf "[`ls -lS edn-tests/valid-edn | awk {'print$9'}`]" > valid-edn.edn
printf "[`ls -lS edn-tests/performance | awk {'print$9'}`]" > performance.edn
