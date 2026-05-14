const router = require("express").Router();
const { stakeUSDC, unstakeUSDC, claimReward, getStake, getStats } = require("../agent/staking");

router.get("/stats", (req, res) => res.json(getStats()));
router.get("/:address", (req, res) => res.json(getStake(req.params.address)));
router.post("/stake", (req, res) => res.json(stakeUSDC(req.body.address, req.body.amount)));
router.post("/unstake", (req, res) => res.json(unstakeUSDC(req.body.address, req.body.amount)));
router.post("/claim", (req, res) => res.json(claimReward(req.body.address)));

module.exports = router;
