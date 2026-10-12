import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ----- Type Definitions -----

  public type UserProfile = { name : Text };

  public type VehicleType = { #truck; #tanker; #trailer; #other };
  public type MaterialUnit = { #kg; #ton; #liter };
  public type TransactionStatus = { #pending; #first_weighed; #completed; #voided };

  public type Vehicle = {
    id : Text;
    plateNumber : Text;
    ownerName : Text;
    vehicleType : VehicleType;
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type Material = {
    id : Text;
    name : Text;
    category : Text;
    unit : MaterialUnit;
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type Supplier = {
    id : Text;
    name : Text;
    contactPerson : Text;
    phone : Text;
    address : Text;
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type Buyer = {
    id : Text;
    name : Text;
    contactPerson : Text;
    phone : Text;
    address : Text;
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type Transaction = {
    id : Text;
    vehicleId : Text;
    materialId : Text;
    supplierId : ?Text;
    buyerId : ?Text;
    operatorId : Principal;
    status : TransactionStatus;
    firstWeight : ?Float;
    secondWeight : ?Float;
    netWeight : ?Float;
    firstWeighTime : ?Time.Time;
    secondWeighTime : ?Time.Time;
    remarks : Text;
    createdAt : Time.Time;
    completedAt : ?Time.Time;
  };

  public type DashboardStats = {
    totalTransactionsToday : Nat;
    totalNetWeightToday : Float;
    totalTransactionsThisWeek : Nat;
    totalNetWeightThisWeek : Float;
    totalTransactionsThisMonth : Nat;
    totalNetWeightThisMonth : Float;
    totalTransactionsAllTime : Nat;
  };

  public type CreateVehicleInput = {
    plateNumber : Text;
    ownerName : Text;
    vehicleType : VehicleType;
  };

  public type CreateMaterialInput = {
    name : Text;
    category : Text;
    unit : MaterialUnit;
  };

  public type CreateSupplierInput = {
    name : Text;
    contactPerson : Text;
    phone : Text;
    address : Text;
  };

  public type CreateBuyerInput = {
    name : Text;
    contactPerson : Text;
    phone : Text;
    address : Text;
  };

  public type CreateTransactionInput = {
    vehicleId : Text;
    materialId : Text;
    supplierId : ?Text;
    buyerId : ?Text;
    remarks : Text;
  };

  // ----- State -----

  let userProfiles = Map.empty<Principal, UserProfile>();
  let vehicles = Map.empty<Text, Vehicle>();
  let materials = Map.empty<Text, Material>();
  let suppliers = Map.empty<Text, Supplier>();
  let buyers = Map.empty<Text, Buyer>();
  let transactions = Map.empty<Text, Transaction>();
  var txCounter : Nat = 0;
  var vehicleCounter : Nat = 0;
  var materialCounter : Nat = 0;
  var supplierCounter : Nat = 0;
  var buyerCounter : Nat = 0;

  // ----- Helpers -----

  func padNat(n : Nat, width : Nat) : Text {
    let s = n.toText();
    if (s.size() >= width) return s;
    var pad = "";
    var i = s.size();
    while (i < width) { pad #= "0"; i += 1 };
    pad # s
  };

  func nowSeconds() : Int { Time.now() / 1_000_000_000 };

  func dayStart(t : Int) : Int { t - (t % 86400) };

  func txCmp(a : Transaction, b : Transaction) : { #less; #equal; #greater } {
    if (a.createdAt > b.createdAt) #less
    else if (a.createdAt < b.createdAt) #greater
    else #equal
  };

  // ----- User Profile -----

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // ----- Vehicles -----

  public shared ({ caller = _ }) func createVehicle(input : CreateVehicleInput) : async Vehicle {
    vehicleCounter += 1;
    let id = "V-" # padNat(vehicleCounter, 5);
    let v : Vehicle = {
      id;
      plateNumber = input.plateNumber;
      ownerName = input.ownerName;
      vehicleType = input.vehicleType;
      isActive = true;
      createdAt = Time.now();
    };
    vehicles.add(id, v);
    v
  };

  public query func listVehicles() : async [Vehicle] {
    vehicles.values().toArray()
  };

  public query func getVehicle(id : Text) : async ?Vehicle {
    vehicles.get(id)
  };

  public shared ({ caller = _ }) func updateVehicle(id : Text, input : CreateVehicleInput) : async ?Vehicle {
    switch (vehicles.get(id)) {
      case null null;
      case (?v) {
        let updated : Vehicle = {
          id = v.id;
          plateNumber = input.plateNumber;
          ownerName = input.ownerName;
          vehicleType = input.vehicleType;
          isActive = v.isActive;
          createdAt = v.createdAt;
        };
        vehicles.add(id, updated);
        ?updated
      };
    }
  };

  public shared ({ caller = _ }) func deactivateVehicle(id : Text) : async Bool {
    switch (vehicles.get(id)) {
      case null false;
      case (?v) {
        vehicles.add(id, { id = v.id; plateNumber = v.plateNumber; ownerName = v.ownerName; vehicleType = v.vehicleType; isActive = false; createdAt = v.createdAt });
        true
      };
    }
  };

  // ----- Materials -----

  public shared ({ caller = _ }) func createMaterial(input : CreateMaterialInput) : async Material {
    materialCounter += 1;
    let id = "M-" # padNat(materialCounter, 5);
    let m : Material = {
      id;
      name = input.name;
      category = input.category;
      unit = input.unit;
      isActive = true;
      createdAt = Time.now();
    };
    materials.add(id, m);
    m
  };

  public query func listMaterials() : async [Material] {
    materials.values().toArray()
  };

  public query func getMaterial(id : Text) : async ?Material {
    materials.get(id)
  };

  public shared ({ caller = _ }) func updateMaterial(id : Text, input : CreateMaterialInput) : async ?Material {
    switch (materials.get(id)) {
      case null null;
      case (?m) {
        let updated : Material = { id = m.id; name = input.name; category = input.category; unit = input.unit; isActive = m.isActive; createdAt = m.createdAt };
        materials.add(id, updated);
        ?updated
      };
    }
  };

  public shared ({ caller = _ }) func deactivateMaterial(id : Text) : async Bool {
    switch (materials.get(id)) {
      case null false;
      case (?m) {
        materials.add(id, { id = m.id; name = m.name; category = m.category; unit = m.unit; isActive = false; createdAt = m.createdAt });
        true
      };
    }
  };

  // ----- Suppliers -----

  public shared ({ caller = _ }) func createSupplier(input : CreateSupplierInput) : async Supplier {
    supplierCounter += 1;
    let id = "S-" # padNat(supplierCounter, 5);
    let s : Supplier = {
      id;
      name = input.name;
      contactPerson = input.contactPerson;
      phone = input.phone;
      address = input.address;
      isActive = true;
      createdAt = Time.now();
    };
    suppliers.add(id, s);
    s
  };

  public query func listSuppliers() : async [Supplier] {
    suppliers.values().toArray()
  };

  public shared ({ caller = _ }) func updateSupplier(id : Text, input : CreateSupplierInput) : async ?Supplier {
    switch (suppliers.get(id)) {
      case null null;
      case (?s) {
        let updated : Supplier = { id = s.id; name = input.name; contactPerson = input.contactPerson; phone = input.phone; address = input.address; isActive = s.isActive; createdAt = s.createdAt };
        suppliers.add(id, updated);
        ?updated
      };
    }
  };

  public shared ({ caller = _ }) func deactivateSupplier(id : Text) : async Bool {
    switch (suppliers.get(id)) {
      case null false;
      case (?s) {
        suppliers.add(id, { id = s.id; name = s.name; contactPerson = s.contactPerson; phone = s.phone; address = s.address; isActive = false; createdAt = s.createdAt });
        true
      };
    }
  };

  // ----- Buyers -----

  public shared ({ caller = _ }) func createBuyer(input : CreateBuyerInput) : async Buyer {
    buyerCounter += 1;
    let id = "B-" # padNat(buyerCounter, 5);
    let b : Buyer = {
      id;
      name = input.name;
      contactPerson = input.contactPerson;
      phone = input.phone;
      address = input.address;
      isActive = true;
      createdAt = Time.now();
    };
    buyers.add(id, b);
    b
  };

  public query func listBuyers() : async [Buyer] {
    buyers.values().toArray()
  };

  public shared ({ caller = _ }) func updateBuyer(id : Text, input : CreateBuyerInput) : async ?Buyer {
    switch (buyers.get(id)) {
      case null null;
      case (?b) {
        let updated : Buyer = { id = b.id; name = input.name; contactPerson = input.contactPerson; phone = input.phone; address = input.address; isActive = b.isActive; createdAt = b.createdAt };
        buyers.add(id, updated);
        ?updated
      };
    }
  };

  public shared ({ caller = _ }) func deactivateBuyer(id : Text) : async Bool {
    switch (buyers.get(id)) {
      case null false;
      case (?b) {
        buyers.add(id, { id = b.id; name = b.name; contactPerson = b.contactPerson; phone = b.phone; address = b.address; isActive = false; createdAt = b.createdAt });
        true
      };
    }
  };

  // ----- Transactions -----

  public shared ({ caller }) func createTransaction(input : CreateTransactionInput) : async Transaction {
    txCounter += 1;
    let year = "2026";
    let id = "WB-" # year # "-" # padNat(txCounter, 5);
    let tx : Transaction = {
      id;
      vehicleId = input.vehicleId;
      materialId = input.materialId;
      supplierId = input.supplierId;
      buyerId = input.buyerId;
      operatorId = caller;
      status = #pending;
      firstWeight = null;
      secondWeight = null;
      netWeight = null;
      firstWeighTime = null;
      secondWeighTime = null;
      remarks = input.remarks;
      createdAt = Time.now();
      completedAt = null;
    };
    transactions.add(id, tx);
    tx
  };

  public shared ({ caller = _ }) func recordFirstWeight(id : Text, weight : Float) : async ?Transaction {
    switch (transactions.get(id)) {
      case null null;
      case (?tx) {
        if (tx.status != #pending) return null;
        let updated : Transaction = {
          id = tx.id; vehicleId = tx.vehicleId; materialId = tx.materialId;
          supplierId = tx.supplierId; buyerId = tx.buyerId; operatorId = tx.operatorId;
          status = #first_weighed;
          firstWeight = ?weight;
          secondWeight = null;
          netWeight = null;
          firstWeighTime = ?Time.now();
          secondWeighTime = null;
          remarks = tx.remarks;
          createdAt = tx.createdAt;
          completedAt = null;
        };
        transactions.add(id, updated);
        ?updated
      };
    }
  };

  public shared ({ caller = _ }) func recordSecondWeight(id : Text, weight : Float) : async ?Transaction {
    switch (transactions.get(id)) {
      case null null;
      case (?tx) {
        if (tx.status != #first_weighed) return null;
        let gross = switch (tx.firstWeight) { case (?w) w; case null weight };
        let tare = weight;
        let net = Float.abs(gross - tare);
        let now = Time.now();
        let updated : Transaction = {
          id = tx.id; vehicleId = tx.vehicleId; materialId = tx.materialId;
          supplierId = tx.supplierId; buyerId = tx.buyerId; operatorId = tx.operatorId;
          status = #completed;
          firstWeight = tx.firstWeight;
          secondWeight = ?tare;
          netWeight = ?net;
          firstWeighTime = tx.firstWeighTime;
          secondWeighTime = ?now;
          remarks = tx.remarks;
          createdAt = tx.createdAt;
          completedAt = ?now;
        };
        transactions.add(id, updated);
        ?updated
      };
    }
  };

  public shared ({ caller = _ }) func voidTransaction(id : Text) : async Bool {
    switch (transactions.get(id)) {
      case null false;
      case (?tx) {
        if (tx.status == #completed) return false;
        let updated : Transaction = {
          id = tx.id; vehicleId = tx.vehicleId; materialId = tx.materialId;
          supplierId = tx.supplierId; buyerId = tx.buyerId; operatorId = tx.operatorId;
          status = #voided;
          firstWeight = tx.firstWeight; secondWeight = tx.secondWeight; netWeight = tx.netWeight;
          firstWeighTime = tx.firstWeighTime; secondWeighTime = tx.secondWeighTime;
          remarks = tx.remarks; createdAt = tx.createdAt; completedAt = null;
        };
        transactions.add(id, updated);
        true
      };
    }
  };

  public query func getTransaction(id : Text) : async ?Transaction {
    transactions.get(id)
  };

  public query func listTransactions() : async [Transaction] {
    transactions.values().toArray().sort(txCmp)
  };

  public query func getRecentTransactions() : async [Transaction] {
    let sorted = transactions.values().toArray().sort(txCmp);
    let limit = if (sorted.size() < 10) sorted.size() else 10;
    Array.tabulate<Transaction>(limit, func(i) { sorted[i] })
  };

  public query func getDashboardStats() : async DashboardStats {
    let now = nowSeconds();
    let todayStart = dayStart(now);
    let weekStartTime = now - 7 * 86400;
    let monthStartTime = now - 30 * 86400;

    var txToday = 0;
    var weightToday : Float = 0;
    var txWeek = 0;
    var weightWeek : Float = 0;
    var txMonth = 0;
    var weightMonth : Float = 0;
    var txAll = 0;

    for (tx in transactions.values()) {
      if (tx.status == #completed) {
        let tsSec = tx.createdAt / 1_000_000_000;
        let net = switch (tx.netWeight) { case (?w) w; case null 0.0 };
        txAll += 1;
        if (tsSec >= todayStart) {
          txToday += 1;
          weightToday += net;
        };
        if (tsSec >= weekStartTime) {
          txWeek += 1;
          weightWeek += net;
        };
        if (tsSec >= monthStartTime) {
          txMonth += 1;
          weightMonth += net;
        };
      };
    };

    {
      totalTransactionsToday = txToday;
      totalNetWeightToday = weightToday;
      totalTransactionsThisWeek = txWeek;
      totalNetWeightThisWeek = weightWeek;
      totalTransactionsThisMonth = txMonth;
      totalNetWeightThisMonth = weightMonth;
      totalTransactionsAllTime = txAll;
    }
  };
};
