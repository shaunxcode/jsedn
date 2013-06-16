printf "[`ls -lS test/edn-tests/valid-edn | awk {'print$9'}`]" > valid-edn.edn
printf "[`ls -lS test/edn-tests/performance | awk {'print$9'}`]" > performance.edn
