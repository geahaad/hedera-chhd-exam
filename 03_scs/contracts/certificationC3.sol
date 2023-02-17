// SPDX-License-Identifier: Hedera Foundation

pragma solidity ^0.8.15;

contract CertificationC1 {


    mapping(address => uint256) function1Called;
    mapping(address => uint256) function2Called;

    /**
     * @dev
     * empty constructor of the contract
     */
    constructor(){
    }

    /**
     * @dev
     * public function to multiply a * b
     * @param a first int to multiply
     * @param b second int to multiply
     */
    function function1(uint16 a, uint16 b) public returns (uint16 result) {
        result = a * b;
        function1Called[msg.sender] = block.number;
        return result;
    }

    /**
     * @dev
     * public function to add 2 to a
     * @param a first int to add to
     */
    function function2(uint16 a) public returns (uint16 result) {
        result = a + 2;
        function2Called[msg.sender] = block.number;
        return result;
    }
}
